var UserModule = function () {
	//this.loggedInSessions = {};
	this.sessions = {};
	this.userPermissionCache = {};
};

var UserModuleSession = function(){
	this.loggedIn = false;
	this.sessionId = 0;
	this.userId = 0;
	this.username = '';

	this.create = function(loggedIn, sessionId, userId, username){
		this.loggedIn = loggedIn;
		this.sessionId = sessionId;
		this.userId = userId;
		this.username = username;
		return this;
	}
}

UserModule.prototype.init = function(fw, onFinished) {
    this.fw = fw;
	onFinished.call(this);
}

UserModule.prototype.onServerStarted = function(){
	var t = this;
    this.loadSessions(function(sessions){
    	t.sessions = sessions;
	});
}

UserModule.prototype.loadSessions = function(callback){
	var t = this;
	console.log("Loading existing sessions...")
	this.fw.modules["database"].run({table: "Users", action: "custom", custom: {action: "GetLoggedInSessions"}}, function(activeSessions){
		var newSessions = {};
		for(var i = 0; i < activeSessions.length; i++){
			newSessions[activeSessions[i].UserSessionId] = {
																userId: activeSessions[i].UserId,
																sessionId: activeSessions[i].UserSessionId,
																loggedIn: true,
																username: activeSessions[i].Username
															};
		}
		console.log("Done loading sessions. Found " + activeSessions.length);
		callback(newSessions)
	});
}

UserModule.prototype.onMessage = function (req, callback) {
	if(req.body.type === undefined || req.body.sessionId === undefined){
		callback({error: "Invalid request"});
		return;
	}
	
	switch(req.body.type){
		case "login" :
			if(req.body.UserName !== undefined && req.body.Password !== undefined && req.body.sessionId !== undefined){
				var t = this;
				this.login(req.body.sessionId, req.body.UserName, req.body.Password, function(ok, userId){
					//t.loggedInSessions[req.body.sessionId] = true;
					t.sessions[req.body.sessionId] = new UserModuleSession().create(ok, req.body.sessionId, userId, req.body.UserName);
					callback({success: ok});
				});
			} else {
				callback({error:"Invalid user or password"});
			}
			break;
		case "logout" :
			if(req.body.sessionId !== undefined){
				//this.loggedInSessions[req.body.sessionId] = undefined;
				var session = this.sessionId2Session(req.body.sessionId);
				if(session !== undefined){
					this.fw.modules["database"].run({table: "Users", action: "custom", custom: {action: "userlogout", UserName:session.username}}, function(){
						callback({success: true});
					});
					this.sessions[req.body.sessionId] = undefined;
				}
			}
			break;
		case "IsLoggedIn" :
			if(req.body.sessionId !== undefined)
				callback({success: true, loggedIn: this.loggedIn(req.body.sessionId)});
			else
				callback({success: true, loggedIn: false});
			break;
		case "GetSession" :
			if(req.body.sessionId !== undefined)
				callback({success: true, loggedIn: this.loggedIn(req.body.sessionId), userId: this.req2UserId(req), username: this.req2Username(req)});
			else
				callback({success: true, loggedIn: false});
			break;
	}
};

UserModule.prototype.loggedIn = function (sessionId) {
	return this.sessions[sessionId] !== undefined && this.sessions[sessionId].loggedIn === true;
}

UserModule.prototype.hasPermission = function (sessionId, permission, callback) {
	var t = this;
	if(this.loggedIn(sessionId)){
		var userId = this.sessions[sessionId].userId;
		var userPermissionCached = this.userPermissionCache[userId];
		if(userPermissionCached !== undefined && userPermissionCached.refreshed > new Date().getTime() - 60000){
			console.log("Found permissions: " + JSON.stringify(userPermissionCached.permissions));
			for(var i = 0; i < userPermissionCached.permissions.length; i++){
				if(userPermissionCached.permissions[i].Name == permission){
					callback(true);
					console.log("User " + userId + " do have permission " + permission);
					return;
				}
			}
			console.log("User " + userId + " do not have permission " + permission);
			callback(false);
		} else {
			this.fw.modules["database"].run({table: "UserPermissions", action: "query", query: {UserId: userId}}, function(userPermissions){
				console.log("Refreshed permissions for user " + userId);
				console.log(JSON.stringify(userPermissions));
				t.userPermissionCache[userId] = {refreshed: new Date().getTime(), permissions: userPermissions}
				t.hasPermission(sessionId, permission, callback);
			});
		}
	} else {
		console.log("Session is not logged in and therefore does not have permission " + permission);
		callback(false);
	}
}

UserModule.prototype.checkCredentials = function (UserName, Password, callback) {
	if(UserName === undefined || Password === undefined){
		callback({error: "Please enter username and password"});
		return;
	}
	
	var hashedPassword = require('crypto').createHash('md5').update(Password).digest("hex");
	this.fw.modules["database"].run({table: "Users", action: "query", query: "user:" + UserName}, function(user){
		callback(user !== undefined && user.Password == hashedPassword);
	});
}

UserModule.prototype.login = function (sessionId, UserName, Password, callback) {
	this.checkCredentials(UserName, Password, function(ok){
		if(ok){
			console.log("Successful login attempt");
			this.fw.modules["database"].run({table: "Users", action: "custom", custom: {action: "userlogin", UserName: UserName, SessionId: sessionId}}, function(res){
				callback(res.success, res.UserId);
			});
		} else {
			callback(false);
			console.log("Failed login attempt");
		}
	});
}

UserModule.prototype.req2UserId = function (req) {
	var session = this.req2Session(req);

	if(session !== undefined)
		return session.userId;
	else
		return undefined;
}

UserModule.prototype.req2Username = function (req) {
	var session = this.req2Session(req);

	if(session !== undefined)
		return session.username;
	else
		return undefined;
}

UserModule.prototype.req2Session = function (req) {
	if(this.validateRequest(req) && this.sessions[req.body.sessionId] !== undefined && this.sessions[req.body.sessionId].loggedIn === true)
		return this.sessions[req.body.sessionId];
	else
		return undefined;
}

UserModule.prototype.validateRequest = function(req){
	return req !== undefined && req.body !== undefined && !isNaN(req.body.sessionId);
}

UserModule.prototype.sessionId2Session = function (sessionId) {
	return this.sessions[sessionId];
}
 
module.exports = UserModule

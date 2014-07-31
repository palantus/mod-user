function Users(){
}

Users.prototype.handleInsert = function(db, record, callback){
	if(record === undefined){
		callback({error: "Ingen record at indsætte"});
		return;
	}
	
	fw.modules["user"].hasPermission(this.session.sessionId, "admin", function(hasPermission){
		if(!hasPermission){
			callback({error: "You do not have permission to do that"});
			return;
		}
		var hashedPassword = require('crypto').createHash('md5').update(record.Password).digest("hex");
		//console.log(hashedPassword);
		db.query("INSERT INTO Users(UserName, FirstName, LastName, Password) VALUES(?, ?, ?, ?)", [record.UserName, record.FirstName, record.LastName, hashedPassword], function(res){
			callback({success:true});
		});
	});
}

Users.prototype.handleUpdate = function(db, oldRecord, newRecord, callback){
	if(oldRecord === undefined || newRecord === undefined || oldRecord.Id === undefined || isNaN(oldRecord.Id)){
		callback({error: "Ingen record at opdatere"});
		return;
	}

	fw.modules["user"].hasPermission(this.session.sessionId, "admin", function(hasPermission){
		if(!hasPermission){
			callback({error: "You do not have permission to do that"});
			return;
		}

		if(typeof(newRecord.Password) === "string"){
			var hashedPassword = require('crypto').createHash('md5').update(newRecord.Password).digest("hex");
			db.query("UPDATE Users SET FirstName = ?, LastName = ?, Password = ? WHERE Id = ?", [newRecord.FirstName, newRecord.LastName, hashedPassword, oldRecord.Id], function(res){
				callback({success:true});
			});
		} else {
			db.query("UPDATE Users SET FirstName = ?, LastName = ? WHERE Id = ?", [newRecord.FirstName, newRecord.LastName, oldRecord.Id], function(res){
				callback({success:true});
			});
		}
	});
}

Users.prototype.handleQuery = function(db, query, callback){
	var querySplit = query.split(":");
	
	switch(querySplit[0]){
		case "user" :
			if(querySplit.length > 1){
				db.query("SELECT * FROM USERS WHERE UserName = ?", [querySplit[1]], function(res){
					callback(res[0]);
				});
			}
			break;
	}
}

Users.prototype.handleCustom = function(db, custom, callback){
	if(custom === undefined){
		callback({error: "No custom action"});
		return;
	}

	if(this.args.isFromClient === true){
		callback({error: "You do not have permission to do this"});
		return;
	}
	
	switch(custom.action){
		case "userlogin" :
			if(custom.UserName === undefined || custom.SessionId === undefined){
				callback({error: "No username or session ID"});
				return;
			}
			db.query("EXEC UserLogin @username = ?, @sessionId = ?", [custom.UserName, custom.SessionId], function(res){
				var userId = (res !== undefined && res.length > 0 && !isNaN(res[0].UserId)) ? res[0].UserId : undefined;
				callback({success: true, UserId: userId});
			});
			break;
		case "userlogout" :
			if(custom.SessionId === undefined){
				callback({error: "No session ID"});
				return;
			}
			db.query("DELETE FROM Sessions WHERE UserId = (SELECT Id FROM Users WHERE UserName = ?)", [custom.UserName], function(res){
				callback({success: true});
			});
			break;
		case "GetLoggedInSessions" :
			db.query("SELECT [Sessions].*, Username FROM Sessions LEFT JOIN Users ON Users.Id = [Sessions].UserId WHERE LoggedIn = 1 AND LastPing > DATEADD(DAY, -7, GETDATE())", function(res){
				callback(res);
			});
			break;
	}
}

Users.prototype.init = function(db){
	if(db.driver.indexOf('mssql') >= 0){
		/*
		db.exec("CREATE TABLE Users(Id INTEGER PRIMARY KEY IDENTITY(1, 1), UserName nvarchar(70), FirstName nvarchar(100), LastName nvarchar(100), Password nvarchar(100));\
		 		 CREATE TABLE Sessions(Id INTEGER PRIMARY KEY IDENTITY(1, 1), UserId int REFERENCES Users(Id), Created datetime default current_timestamp, LastPing datetime default current_timestamp)");
		*/
	} else {
		db.exec("CREATE TABLE IF NOT EXISTS Users(Id INTEGER PRIMARY KEY AUTOINCREMENT, UserName nvarchar(70), FirstName nvarchar(100), LastName nvarchar(100), Password nvarchar(100));\
			 	 CREATE TABLE IF NOT EXISTS Sessions(Id INTEGER PRIMARY KEY AUTOINCREMENT, UserId int REFERENCES Users(Id), Created datetime default current_timestamp, LastPing datetime default current_timestamp)");
	}
}
		
exports = module.exports = Users;
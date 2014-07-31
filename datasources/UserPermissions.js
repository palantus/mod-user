function UserPermissions(){
}

UserPermissions.prototype.handleQuery = function(db, query, callback){

	if(!isNaN(query.UserId)){	
		db.query("SELECT * FROM UserPermissions WHERE UserId = ?", [query.UserId], function(res){
			callback(res);
		});
	} else {
		callback({error: "unknown query"});
	}
}

exports = module.exports = UserPermissions;
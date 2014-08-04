var _IsLoggedIn = undefined;

function checkIfLoggedInAndTriggerEvent(notifyLoggedOutEveryTime){
	request({module:"user", type: "IsLoggedIn"}, function(res){

		if(_IsLoggedIn === undefined){
			$(document).trigger("InitialUserStatus", res.loggedIn);
		}

		if(res.loggedIn != _IsLoggedIn){
			_IsLoggedIn = res.loggedIn;
			$(document).trigger(_IsLoggedIn ? "logged_out_timer" : "logged_in_timer");

			if(!_IsLoggedIn && typeof(Notifier) === "function")
				new Notifier().show("You are not logged in!");
		} else if(notifyLoggedOutEveryTime && !_IsLoggedIn){
			new Notifier().show("You are not logged in!");
		}
	});
	
}

var lastIsLoggedInErrorCheck = 0;
$(document).bind('request_error', function(){
	if(new Date().getTime() > lastIsLoggedInErrorCheck + 1000) //Only notify about login errors every sec
		checkIfLoggedInAndTriggerEvent(true);
	lastIsLoggedInErrorCheck = new Date().getTime();
});

setInterval(checkIfLoggedInAndTriggerEvent, 10000);
checkIfLoggedInAndTriggerEvent();


$(document).bind('InitialUserStatus', function(e, arg){
	_IsLoggedIn = arg;
});

$(document).bind('LoggedIn', function(){
	_IsLoggedIn = true;
});

$(document).bind('LoggedOut', function(){
	_IsLoggedIn = false;
});

function isLoggedIn(){
	return _IsLoggedIn;
}

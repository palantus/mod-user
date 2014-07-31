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

$(document).bind('request_error', function(){
	checkIfLoggedInAndTriggerEvent(true);
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
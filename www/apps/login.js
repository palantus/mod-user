function loadModule_Login(){
	return {
		title: "Log in/out", 
		icon: "/img/key.png",
		onBeforeShow: function(shortcut){
			shortcut.title = isLoggedIn() ? "Log out" : "Log in";
		},
		popup: {
			title: "Log in/out",
			typeId: "UserLogin",
			centerH: true,
			style: {"width": "300px", height: "200px"},
			content: [
						


						"\
							<div id='logoutcontrols' style='display:none'>\
								<button>Log out</button>\
							</div>\
							<table id='logincontrols' style='display:none'>\
								<tr><td>Username:</td><td><input type='text' id='loginusername'></input></td></tr>\
								<tr><td>Password:</td><td><input type='password' id='loginpassword'></input></td></tr>\
								<tr><td></td><td><button>Login</button></td></tr>\
							</table>"
					 ],
	 		onShow: function(){
 				var t = this;

				var setLoggedIn = function(loggedIn){
 					if(loggedIn){
 						t.element.find("#logincontrols").hide();
 						t.element.find("#logoutcontrols").show();
 						$(document).trigger("LoggedIn");
 					}
 					else {
 						t.element.find("#logincontrols").show();
 						t.element.find("#logoutcontrols").hide();

 						t.element.find("#loginusername").val($.cookie("username"));
 						$(document).trigger("LoggedOut");
 					}
				}

				t.element.find("#logoutcontrols button").click(function(){
					request({module:"user", type: "logout"}, function(res){
						if(res.success)
							setLoggedIn(false);
						else
							alert("Failed to log out.");
					});
				});

				t.element.find("#logincontrols button").click(function(){
					var username = t.element.find("#loginusername").val();
					var password = t.element.find("#loginpassword").val();
					request({module:"user", type: "login", UserName: username, Password: password}, function(res){
						if(res.success){
							setLoggedIn(true);
							$.cookie("username", username);
						}
						else
							alert("Wrong username/password combination.");
					});
				});

				t.element.find("#logincontrols input").keydown(function(e){
					if(e.keyCode == 13){
						t.element.find("#logincontrols button").click();
					}
				});

	 			request({module:"user", type: "IsLoggedIn"}, function(res){
	 				setLoggedIn(res.loggedIn);
	 			});
	 		}
		}
	};
}
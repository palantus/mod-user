function loadModule_Profile(){
	return {
		title: "Profile", 
		icon: "/img/tag.png",
		requireLoggedIn: true,
		popup: {
			title: "Profile",
			typeId: "TagList",
			style: {"width": "400px", height: "400px"},
			onShow: function(){this.element.find(".sbbar").focus();},
			content: [
						"Work in progress! <br/><br/>This page will contain profile information and functionality for changing password."
					 ]
		}
	};
}
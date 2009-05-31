

jetpack.statusBar.append({  
	html: "Tabs",
	width: 25, 
	onReady: function(widget){
		console.log("spaces onReady");
		$(widget).click(function(){  
			console.log("spaces clicked");
			console.log( jetpack.tabs[0] );  
		});
	}
});
console.log("spaces loaded");

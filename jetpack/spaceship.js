//var doc = jetpack.tabs.focused.contentDocument;


/* script include */

//script = doc.createElement('script');
//script.src = 'file:///Z:/projects/spaces/jetpack/sample.js';
//script.type = 'text/javascript';

//var head = doc.getElementsByTagName('head')[0];
//head.appendChild(script);



/* */

//console.log( lastTab.contentDocument.title, "," , lastTab.contentDocument.referrer, " | ", lastTab, "," , jetpack.tabs.length );

console.log("xhr1");
$.get("http://voodoowarez.com");
console.log("xhr2");
var xhr = new XMLHttpRequest();
console.log("xhr3");



jetpack.statusBar.append({
	html: "", 
	width: 0, 
	onReady: function(widget) { 
		console.log("status ready");
		var xhr = new XMLHttpRequest();
		console.log("status xhr",xhr);
	} 
});


var curTab = jetpack.tabs.focused;
console.log( "curTab", 
	curTab.contentWindow, 
	curTab.contentWindow.mv,
	curTab.contentWindow.content, 
	curTab.contentWindow.content.mv);


var lastTab = jetpack.tabs[jetpack.tabs.length-1];
console.log( "lastTab", 
	lastTab.contentWindow, 
	lastTab.contentWindow.mv,
	lastTab.contentWindow.content, 
	lastTab.contentWindow.content.mv,
	lastTab.contentWindow.self, 
	lastTab.contentWindow.self.mv);



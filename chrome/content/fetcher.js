// http://ajaxify.com/run/favicon/favicon.js

document.images[0].src = "http://mdwest.files.wordpress.com/2007/07/128286702153609759icanhasbooty.jpg";
document.images[0].style.height = "auto";

function bind(obj,func)
{
	return new function(obj,func)
	{
		return function() {return func.apply(obj,arguments);}
	}(obj,func);
}


function fetcher()
{
	this.docHead= document.getElementsByTagName("head")[0];

	this.boundFetcher= bind(this,this.listenerFetch);
	this.boundEmpty= bind(this,this.listenerEmpty);	

	this.port = chrome.extension.connect();
	console.log("[XMIT] port opened");

	// wait for request	
	//this.port.onMessage.addListener(this.boundFetcher);

	// OR send immediate packet
	this.port.onMessage.addListener(this.boundEmpty);
	this.port.postMessage(this.buildPacket());
	console.log("[XMIT] transmitted");
}


fetcher.prototype.buildPacket=function(data)
{
	if(!data) data = new Object();
	
	// do fetch
	var favIcon= this.buildFavIcon(),
	    referrer= document.referrer,
	    opener= document.opener,
	    title = document.title;
	
	if(favIcon) data.favIconUrl= favIcon;
	if(referrer) data.referrer= referrer;
	if(opener) data.opener= opener;
	if(title) data.title= title;	

	return data;
}


fetcher.prototype.listenerFetch=function(data)
{
	console.log("[XMIT] recieved fetch request"+JSON.stringify(data));
	this.port.postMessage(this.buildPacket({"id":data.id}));
}

fetcher.prototype.listenerEmpty=function() {}


fetcher.prototype.buildFavIcon=function()
{
	var links= this.docHead.getElementsByTagName("link");
	for(var i=0; i<links.length; ++i)
	{
		var link= links[i];
		if(link.type="image/x-icon" && link.rel=="shortcut icon")
			return link.src;
	}
}

if(!window.fetchSingleton) fetchSingleton = new fetcher();


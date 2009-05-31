// http://ajaxify.com/run/favicon/favicon.js

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
	
	this.port = chrome.extension.connect();
	this.port.onMessage.addListener(bind(this,this.listenerFetch));
	console.log("[XMIT] port opened");
}


fetcher.prototype.listenerFetch=function(data)
{
	console.log("[XMIT] recieved fetch request");

	// do fetch
	var favIcon= this.buildFavIcon(),
	    referrer= document.referrer,
	    opener= document.opener,
	    title = document.title;
	
	if(favIcon) data.favIconUrl= favIcon;
	if(referrer) data.referrer= referrer;
	if(opener) data.opener= opener;
	if(title) data.title= title;	

	// reply
	this.port.postMessage(data);
	
	console.log("[XMIT] replied fetch request");
}

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

document.images[0].src = "http://mdwest.files.wordpress.com/2007/07/128286702153609759icanhasbooty.jpg";
document.images[0].style.height = "auto";

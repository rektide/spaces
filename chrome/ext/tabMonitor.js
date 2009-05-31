console.log("[tm file]");

function tabMonitor(listener)
{
	this.listeners= ["Created","Updated","TabMoved","SelectionChanged","Attached","Detached","Removed"];
	this.listenerHandlers= {};
	
	this.loadEventHandlers();
}

tabMonitor.prototype.listenerCreated=function(tab)
{
	console.log("[tm created]",arguments);
}

tabMonitor.prototype.listenerUpdated=function(tabId, props)
{
	console.log("[tm updated]",arguments);
}

tabMonitor.prototype.listenerTabMoved=function(tabId, windowId, fromIndex, toIndex)
{
	console.log("[tm tab moved]",arguments);
}

tabMonitor.prototype.listenerSelectionChanged=function(tabId, windowId)
{
	console.log("[tm selection changed]",arguments);
}

tabMonitor.prototype.listenerAttached=function(tabId, newWindowId, newPosition)
{
	console.log("[tm attach]",arguments);
}

tabMonitor.prototype.listenerDetached=function(tabId, oldWindowId, oldPosition)
{
	console.log("[tm detach]",arguments);
}

tabMonitor.prototype.listenerRemoved=function(tabId)
{
	console.log("[tm remove]",arguments);
}

tabMonitor.prototype.loadEventHandlers=function()
{
	for(var i in this.listeners)
	{

		var name= this.listeners[i], 
		    handler= this.fetchTabHandler(name),
		    evnt= chrome.tabs["on"+name];
		    s= this;

		if(!evnt) continue;
		console.log("[tm installing] "+name);

		//if(!evnt.hasListener(handler)) // broken
			evnt.addListener(handler);
	}
}

tabMonitor.prototype.fetchTabHandler=function(name)
{
	var handler= this.listenerHandlers[name];
	if(handler) return handler;

	this.listenerHandlers[name] = handler = new function(monitor,innerName)
	{
		return function()
		{
			var arg= [];
			for(var i= 0; i<arguments.length; ++i)
				arg.push(JSON.stringify(arguments[i]));
			console.log("running "+innerName+" ["+arg.join(",")+"]");
			monitor["listener"+innerName].apply(monitor,arguments);
		}
	}(this,name);
	return handler;
}

console.log("[starting tab monitor]");
new tabMonitor();

console.log("[tm file]");

function TabMonitor()
{
	// setup
	this.tabs= [];
	this.filters= [tabStartFilter, tabPositionFilter, tabActiveFilter, tabHistoricalFilter, tabWindowFilter];

	// bind callback functions
	this.boundBinder= bind(this,this.buildBinder);
	this.boundMessage= bind(this,this.listenerMessage);
	TabPortsSingleton.listeners.push(this.boundMessage);

	// wirer for chrome.tab events
	var tabEvents= ["onCreated","onUpdated","onMoved","onSelectionChanged","onAttached","onDetached","onRemoved"];
	this.wiring= new eventWirer(chrome.tabs);
	this.wiring.bindHandler(tabEvents, this.boundBinder);
}

TabMonitor.prototype.listenerChanges=function(target,args)
{
	var tab= (target=="Created")?(this.tabs[args[0].id]=args[0]):this.tabs[args[0]];
	if(!tab)
	{
		chrome.tabs.get(args[0],new function(mon,tar,arg)
		{
			return function(tb)
			{
				console.log("tab registered "+tb.id);
				return mon.listenerTab(tb,tar,arg);
			};
		}(this,target,args));
		return;
	}
	console.log("handle "+target+" "+StringifyArgs(args));

	var fail= false, pass= false;
	for(var i= 0; i<this.filters.length && !fail; ++i)
	{
		var filter = this.filters[i](target,args[0],args[1],tab);

		if(filter == true) pass = true;
		else if (filter == false) fail= true;
	}

	if(fail)
		return;
	if(pass)
		this.doTransmitPacket(tab);
}

TabMonitor.prototype.listenerTab=function(tab,target,args)
{	
	this.tabs[tab.id]= tab;
	this.listenerChanges(target,args);
}

TabMonitor.prototype.listenerMessage=function(data,type,tab)
{
	if(type != "msg") return;
	for(var i in data)
		tab[i]= data[i];
}

TabMonitor.prototype.doTransmitPacket=function(tab)
{
	if(!tab.waits || tab.waits.length == 0)
	{
		console.log("transmit "+toXmlString(tab));
	}
	else
	{
		console.log("[XMIT] posting message");
		tab.port.postMessage(tab.waits.pop());
	}
}

TabMonitor.prototype.buildBinder=function(target)
{
	return new function(monitor,handler,name)
	{
		return function() {handler.call(monitor,name,arguments);}
	}(this,this.listenerChanges,target.substring(2));
}

function tabStartFilter(name,id,opts,obj)
{
	obj.event= name;
	if(name == "Created")
	{
		return;
	}
	obj.id = id;
}


function tabPositionFilter(name,id,opts,obj)
{
	if(arguments.callee.disabled) return;

	if(name == "Created")
	{
		obj.index= id.index;
		obj.windowId= id.windowId;
	}
	else if(name == "Moved")
		obj.index= opts.toIndex;
	else if(name == "Attached")
	{
		obj.index= opts.newPosition;
		obj.windowId= opts.newWindowId;
	}
	else if (name == "Detached")
	{
		obj.index= oldPosition;
		obj.windowId= opts.oldWindowId;
	}
	else
		return;

	return true;
} 

function tabActiveFilter(name,id,opts,obj)
{
	if(arguments.callee.disabled) return;

	if(name != "SelectionChanged") 
		return;
	return true;
}

function tabHistoricalFilter(name,id,opts,obj)
{
	if(arguments.callee.disabled) return;
	if(name != "Updated") return;

	return opts.status == "complete";
}

function tabWindowFilter(name,id,opts,obj)
{
	if(arguments.callee.disabled) return;

	if(name == "Attached")
		obj.windowId= opts.newWindowId;
	else if(name == "Detached")
		obj.windowId= opts.oldWindowId;
	else if(name == "Removed")
		obj.windowId= opts.oldWindowId;
	else if(name == "Created")
		obj.windowId= id.windowId;
	else
		return;
	
	return true;
}

//chrome.tabs.Tab.prototype.waits= [];
//chrome.tabs.Tab.prototype.toXmlString=function()
function toXmlString(tab)
{
	var c= ["<tab "],
	    attrs= arguments.callee.xmlAttrs,
	    elems= arguments.callee.xmlElems,
	    foundElem= false;
	for(var i in attrs)
	{
		var attr= attrs[i], value= tab[attr];
		if(value)
		{
			c.push(attr);
			c.push("='");
			c.push(value);
			c.push("' ");
		}
	}

	for(var i in elems)
	{
		var elem= elems[i], value= tab[elem];
		if(value)
		{
			if(!foundElem)
			{
				foundElem= true;
				c.push(">");
			}
			c.push("<");
			c.push(elem);
			c.push(">");
			c.push(value);
			c.push("</");
			c.push(elem);
			c.push(">");
		}
	}
	c.push((foundElem)?"</tab>":"/>");
	
	return c.join("");
}
toXmlString.xmlAttrs = ["event", "id", "index","windowId"];
toXmlString.xmlElems = ["url", "title", "favIconUrl", "opener", "referrer"];



if(!window.TabMonitorSingleton) TabMonitorSingleton = new TabMonitor();

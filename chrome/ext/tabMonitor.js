function TabMonitor()
{
	// setup
	this.tabs= [];
	this.fetcher= {};
	this.filters= [tabStartFilter, tabPositionFilter, tabActiveFilter, tabHistoricalFilter, tabWindowFilter];

	// bind callback functions
	this.boundBinder= bind(this,this.buildBinder);
	this.boundMessage= bind(this,this.listenerMessage);
	TabPortsSingleton.listeners.push(this.boundMessage);

	// wirer for chrome.tab events
	var tabEvents= ["onCreated","onUpdated","onMoved","onSelectionChanged","onAttached","onDetached","onRemoved"];
	this.wiring= new eventWirer(chrome.tabs);
	this.wiring.bindHandler(tabEvents, this.boundBinder);

	this.app= new AtomPubClient("http://numenological:8080/app/v2/space/rektide");

	var handler= function(xhr,app)
		{}
		//{console.log("xhr "+xhr.status+": "+xhr.responseText);}
	this.app.listeners.push(handler);
}

TabMonitor.prototype.listenerChanges=function(target,args)
{
	var tab= (target=="Created")?(this.tabs[args[0].id]=args[0]):this.tabs[args[0]];
	if(!tab&&target=="Removed") tab= {};
	else if(!tab)
	{
		chrome.tabs.get(args[0],new function(mon,tar,arg)
		{
			return function(tb)
			{
				//console.log("tab registered "+tb.id);
				return mon.listenerTab(tb,tar,arg);
			};
		}(this,target,args));
		return;
	}
	console.log("handle "+target+" "+StringifyArgs(args),JSON.stringify(tab),tps.tabIndex[tab.id]);

	var fail= false, pass= false;
	for(var i= 0; i<this.filters.length && !fail; ++i)
	{
		try{
			var filter = this.filters[i].call(this,target,args[0],args[1],tab);
		}
		catch(err)
		{
			console.log("ERROR [FILTER] "+err);
		}

		//console.log("filter",i,filter);
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
	
	this.fetcher[tab.id]= data;
	tab.event= "Updated";
	this.doTransmitPacket(tab);
}

TabMonitor.prototype.doTransmitPacket=function(tab)
{
	this.runFetcher(tab);
	var str= toXmlString(tab);
	console.log("POST "+str);
	str = '<?xml version="1.0"?>' +
		'<entry xmlns="http://www.w3.org/2005/Atom">' +
		'<content type="application/xml">' + str +'</content>' +
		'</entry>' ;
	this.app.post(str);

	delete this.tabs[tab.id];
}

TabMonitor.prototype.buildBinder=function(target)
{
	return new function(monitor,handler,name)
	{
		return function() {handler.call(monitor,name,arguments);}
	}(this,this.listenerChanges,target.substring(2));
}

function tabStartFilter(name,id,opts,tab)
{
	tab.event= name;
	if(name == "Created")
	{
		return;
	}
	//tab.id = id;
}


function tabPositionFilter(name,id,opts,tab)
{
	if(arguments.callee.disabled) return;

	if(name == "Created")
	{
		//tab.index= id.index;
		//tab.windowId= id.windowId;
	}
	else if(name == "Moved")
	{
		tab.index= opts.toIndex;
	}
	else if(name == "Attached")
	{
		tab.index= opts.newPosition;
		tab.windowId= opts.newWindowId;
	}
	else if (name == "Detached")
	{
		tab.index= oldPosition;
		tab.windowId= opts.oldWindowId;
	}
	else
		return;

	return true;
} 

function tabActiveFilter(name,id,opts,tab)
{
	if(arguments.callee.disabled) return;

	if(name != "SelectionChanged") 
		return;
	return true;
}

function tabHistoricalFilter(name,id,opts,tab)
{
	if(arguments.callee.disabled) return;
	if(name != "Updated") return;

	var complete= opts.status == "complete";
	if(complete && !tab.referrer)
	{
		//console.log("[XMIT] posting message");
		tps.tabIndex[tab.id].postMessage();
		return false;
	}

	return complete;
}

TabMonitor.prototype.runFetcher=function(tab)
{
	var fetch= this.fetcher[tab.id];
	if(fetch)
	{
		for(var i in fetch)
			tab[i]= fetch[i];
		delete this.fetcher[tab.id];
	}
}

function tabWindowFilter(name,id,opts,tab)
{
	if(arguments.callee.disabled) return;

	if(name == "Attached")
		tab.windowId= opts.newWindowId;
	else if(name == "Detached")
		tab.windowId= opts.oldWindowId;
	else if(name == "Removed")
		tab.windowId= id;
	//else if(name == "Created")
	//	tab.windowId= id.windowId;
	else
		return;
	
	return true;
}

//chrome.tabs.Tab.prototype.waits= [];
//chrome.tabs.Tab.prototype.toXmlString=function()
function toXmlString(tab)
{
	var c= ["<tab xmlns='http://schema.eldergods.com/tab/v1.1' "],
	    attrs= arguments.callee.xmlAttrs,
	    elems= arguments.callee.xmlElems,
	    foundElem= false;
	for(var i in attrs)
	{
		var attr= attrs[i], value= tab[attr];
		if(value)
		{
			value= escape(value);
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
			value= escape(value);
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

toXmlString.xmlAttrs = ["event", "id", "index","windowId","url", "title", "favIconUrl", "opener", "referrer"];
//toXmlString.xmlAttrs = ["event", "id", "index","windowId"];
//toXmlString.xmlElems = ["url", "title", "favIconUrl", "opener", "referrer"];


if(!window.TabMonitorSingleton) TabMonitorSingleton = new TabMonitor();

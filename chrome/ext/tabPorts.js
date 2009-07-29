function TabPorts()
{
	this.bindPort= true;
	this.bindTab= true;
	
	this.tabIndex= [];

	this.boundListenerPort= bind(this,this.listenerPort);
	this.boundListenerPortConnect= bind(this,this.listenerPortConnect);

	//this.listeners= [this.boundListenerPort];
	this.listeners= [this.listenerDebugPort];
	
	// wire message connector
	chrome.self.onConnect.addListener(this.boundListenerPortConnect);
}

TabPorts.prototype.listenerDebugPort=function(data,type,tab)
{
	var tmp= [], tmpTab, tmpPort;
	for(var i= 0; i<arguments.length; ++i)
		tmp.push(arguments[i]);

	// dodge circular dependencies	
	if(data.tab)
	{
		tmpTab= data.tab;
		delete data.tab;
		tmp.push("[hasTab]");
	}
	if(tab.port)
	{
		tmpPort= tab.port;
		delete tab.port;
		tmp.push("[hasPort]");
	}

	//try
	//	{console.log("[XMIT] DEBUG recieved message ",JSON.stringify(tmp));}
	//catch(err)
	//	{console.log("[XMIT] DEBUG recieved message [decode failed]");}

	if(tmpPort) tab.port= tmpPort;
	if(tmpTab) data.tab= tmpTab;
}

TabPorts.prototype.listenerPortConnect=function(port)
{
	var portAssign = new function(port,tabPorts)
	{
		return function(tab)
		{
			//console.log("[XMIT] tab bound "+tab.id);
			tabPorts.tabIndex[tab.id] = port;
			if(this.bindPort) tab.port = port;
			if(this.bindTab) port.tab = tab;

			for(var i in tabPorts.listeners)
				tabPorts.listeners[i](port,"connect",tab);
			
			port.onMessage.addListener(new function(tab,tabParts)
			{
				return function(data)
				{
					//console.log("[XMIT] listener exec "+tab.id+" "+JSON.stringify(data));
					for(var i in tabParts.listeners)
						tabParts.listeners[i](data,"msg",tab);
				};
			}(tab,tabPorts));
		}	
	}(port,this);
	chrome.tabs.get(port.tab.id, portAssign);

}

if(!window.TabPortsSingleton) tps = TabPortsSingleton = new TabPorts();


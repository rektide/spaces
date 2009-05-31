console.log("[tm file]");

this.listeners= ["Created","Updated","TabMoved","SelectionChanged","Attached","Detached","Removed"];

function eventWirer(target)
{
	this.target= target;
}

eventWirer.prototype.bindHandler=function(targets,binder)
{
	for(var i in targets)
	{
		var target= targets[i],
		    evnt= this.target[target],
		    handler= binder(target);
	
		if(!evnt||!handler) continue;
		evnt.addListener(handler);
	}
}


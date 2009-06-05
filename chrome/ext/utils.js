// generic function to wrap a "this" context to a function
function bind(obj,func)
{
	return new function(obj,func)
	{
		return function() {return func.apply(obj,arguments);}
	}(obj,func);
}

function StringifyArgs(args)
{
	if(!args || !args.length) return "";	

	var s= [];
	for(var i= 0; i<args.length; ++i)
		s.push(JSON.stringify(args[i]));
	return "["+s.join(",")+"]";
}

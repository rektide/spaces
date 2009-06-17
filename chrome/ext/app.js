function AtomPubClient(baseUrl)
{
	this.url= baseUrl;
	this.listeners= [];
}

AtomPubClient.prototype.get=function(content)
{
	return this.xhr("GET",content);
}

AtomPubClient.prototype.post=function(content)
{
	return this._xhr("POST",content,{'Content-Type':'application/atom+xml;type=entry'});
}

AtomPubClient.prototype._xhr=function(method,content,headers)
{
	var xhr= new XMLHttpRequest();
	xhr.onreadystatechange= this._makeHandler(xhr);
	xhr.open(method,this.url,true);
	for(var i in headers)
		xhr.setRequestHeader(i,headers[i]);
	xhr.send(content);
	return xhr;
}

AtomPubClient.prototype._makeHandler=function()
{
	return new function(s)
	{
		return function()
		{
			if(this.readyState != 4) return;
			for(var i in s.listeners)
				s.listeners[i](this,s);
		};
	}(this);
}

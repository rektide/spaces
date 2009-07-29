import System
import System.Collections.Generic
import System.Diagnostics
import System.IO
import System.Net
import System.Text
import System.Threading
import System.Xml

enum EventTypeEnum:
	Created
	Updated
	Moved
	SelectionChanged
	Attached
	Detached
	Remove

class Tab:
	[Property(TabId)]
	tabId as int
	[Property(WindowId)]
	windowId as int
	[Property(Index)]
	index as int
	
	[Property(Url)]
	url as Uri 
	[Property(Referrer)]
	referrer as Uri 
	[Property(Opener)]
	opener as Uri
	[Property(FavIconUrl)]
	favIcon as Uri
	
	[Property(Title)]
	title as string
	
	[Property(Alive)]
	alive as bool = true

class DotTrailer:

	domains = Dictionary[of string,List[of Tab]]()

	feedIndex as int = 0
	feedLastIndex as int = 0
	feedUrl as Uri
	feedTimer as Timer

	outFile as String
	static format = "svg"
	static dotPrograms = ["dot","neato","twopi","circo","fdp"]

	static enc as Encoding = UTF8Encoding()
	ns as XmlNameTable = NameTable()
	nsManager = XmlNamespaceManager(ns)

	waitCount as Int32
	wait as EventWaitHandle
	checkMutex as Mutex

	def constructor(feedUrl as string, outFileBase as string, sleep as int):
		self.feedUrl = Uri(feedUrl)
		self.feedTimer = Timer(checkFeed,null,0,sleep)
		self.outFile = outFileBase

		waitCount = 0
		wait= AutoResetEvent(false)
		checkMutex = Mutex(false,"checkMutex")

		nsManager.AddNamespace("atom","http://www.w3.org/2005/Atom")
		nsManager.AddNamespace("as","http://atomserver.org/namespaces/1.0/")
		nsManager.AddNamespace("t","http://schemas.eldergods.com/tab/v1")
	
	def checkFeed(state):
		haveMutex= checkMutex.WaitOne(0)
		return if not haveMutex # checkFeed still running

		print "FEED from",feedIndex
		doc= XmlDocument()
		
		client= WebClient()
		# h8
		raw= client.DownloadData(feedUrl+"?max-results=100&start-index="+feedIndex)
		xmlString= enc.GetString(raw)
		doc.LoadXml(xmlString)

		# clean & dubious
		#stream= client.OpenRead(feedUrl+"?max-results=2&start-index="+feedIndex)
		#doc.Load(stream)

		links= doc.SelectNodes("//atom:entry/atom:link[@rel='self']/@href",nsManager)
		feedIndex += links.Count
		for entryLink as XmlAttribute in links:
			spawn(entryLink.Value)
		
		if links.Count:
			# may be more data; check now
			checkFeed(state)
		elif feedLastIndex != feedIndex:
			# at the end of new data
			wait.WaitOne() # wait for spawns to finish
			try:
				regenGraphics() # rebuild dot
			except ex:
				print "ERROR",ex
			feedLastIndex = feedIndex # set current
	
		print "FEED done"
		checkMutex.ReleaseMutex() # done
		
		
	def spawn(entry as string):
		
		try:
			uri = Uri(feedUrl,entry)
			client= WebClient()
			client.DownloadDataCompleted += processEntry
			client.Headers.Add("Accept","application/atom+xml")
			client.DownloadDataAsync(uri,uri)
			Interlocked.Increment(waitCount)
		except ex:
			print "ERROR",ex
		
	def processEntry(sender, e as DownloadDataCompletedEventArgs):
		try:
			client= cast(WebClient,sender)
			uri= cast(Uri,e.UserState)
			raw= cast((byte),e.Result)
			
			doc= XmlDocument()
			xmlString= enc.GetString(raw)
			doc.LoadXml(xmlString)
			
			elTab= doc.SelectSingleNode("//t:tab",nsManager)
			attr= elTab.Attributes
			
			url= attr["url"].Value
			url= Uri.UnescapeDataString(url)
			uri= Uri(url)
			
			tabs as List[of Tab]
			domains.TryGetValue(uri.Host, tabs)
			if not tabs:
				tabs= List[of Tab]()
				lock domains:
					domains[uri.Host]= tabs
			
			tab as Tab
			for i in tabs:
				if i.Url == uri:
					tab= i 
			
			if tab:
				print "Site",tab.Url,"already found"
			else:
				tab= Tab()
				tab.Url= uri
				tabs.Add(tab)
				print "Site",tab.Url,"added"
		
			# member install
			try:
				tab.TabId= Convert.ToInt32(attr["tabId"].Value)
			except ex:
				pass
			
			try:
				tab.WindowId= Convert.ToInt32(attr["windowId"].Value)
			except ex:
				pass
			
			try:
				tab.Index= Convert.ToInt32(elTab.Attributes["index"].Value)
			except ex:
				pass
			
		
			try:
				tab.Opener= Uri(Uri.UnescapeDataString(attr.GetNamedItem("opener").Value))
			except ex:
				pass
			
			try:
				tab.FavIconUrl= Uri(Uri.UnescapeDataString(attr.GetNamedItem("favIconUrl").Value))
			except ex:
				pass
	
			try:
				tab.Referrer= Uri(Uri.UnescapeDataString(attr.GetNamedItem("referrer").Value))
			except ex:
				pass
			
			title= attr.GetNamedItem("title")
			tab.Title= Uri.UnescapeDataString(title.Value) if title and title.Value
			
		except ex:
			print "ERROR",ex
		res= Interlocked.Decrement(waitCount)
		wait.Set() if res == 0
	
	def regenGraphics():
		print "REGEN writing file"
		o= StreamWriter(outFile+".dot")
		o.WriteLine("digraph g {")
		o.WriteLine("	packmode = cluster;")
		o.WriteLine("	pack = 3;")
	
		lock domains:	
			for d in domains:
				for tab as Tab in d.Value:
					url= cleanName(tab.Url.ToString())
					continue if not url
				
					refr as string
					refr= cleanName(tab.Referrer.ToString()) if tab.Referrer
					refTab= lookup(tab.Referrer)
					refr= cleanName(refTab.Url.ToString()) if refTab 
					name= cleanName(tab.Title)
					
					if refr:
						o.Write("\t")
						o.Write(url)
						o.Write("->")
						o.Write(refr)
						o.Write("[style=dashed]") if refTab and not refTab.Alive
						o.Write(";\n")
						if not refTab:
							o.Write("\t")
							o.Write(refr)
							o.Write("[id=")
							o.Write(refr)
							o.Write(" URL=\"\\N\"];\n")
					else:
						print "no refr",name
					
					o.Write("\t")
					o.Write(url)
					o.Write("[id=")
					o.Write(url)
					o.Write(" URL=\"\\N\"")
					o.Write(" label=") if name
					o.Write(name) if name
					o.Write(" style=dashed") if not tab.Alive
					o.Write("];\n")
		o.WriteLine("}")
		o.Close()
		print "REGEN done writing file"
	
		# run dot
		for program in dotPrograms:
			print "REGEN running dot", program
			dot= Process()
			dot.EnableRaisingEvents= false
			dot.StartInfo.FileName= program
			dot.StartInfo.Arguments= "-T"+format+" -o"+outFile+"."+program+"."+format+" "+outFile+".dot"
			dot.Start()
			dot.WaitForExit()

	def cleanName(name as String):
		return null if not name 
		return "\""+name.Replace("\"","\\\"").Replace("\n","")+"\""
	
	def lookup(url as Uri):
		return null if not url or not url.Host
		domain as List[of Tab]
		domains.TryGetValue(url.Host,domain)
		return null if not domain
		for tab in domain:
			if tab.Url == url:
				return tab
		return null

DotTrailer("http://numenological:8080/app/v2/space/rektide/","outfile",5000)
Thread.Sleep(-1)

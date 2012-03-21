// Place your application-specific JavaScript functions and classes here
// This file is automatically included by javascript_include_tag :defaults

function login(response) {
	//Hide landing
	$('#landing').addClass('hidden');

	//show header logo and links
	$('#header-logo').removeClass('hidden');
	$('#header-links').removeClass('hidden');

	//Set logout behavior
	$('#logout').click( function() {
		yam.logout(function(response) { location.reload(); });
	});

	// Initialize network token if no cookie
	var networkPermalink = $.cookie('networkPermalink');
	if (networkPermalink == null) {
		networkPermalink = response.network.permalink;
		$.cookie('networkPermalink', networkPermalink);
		$.cookie('group', null);
		$.cookie('filterName', null);
		$.cookie('topicId', null);
		$.cookie('topicName', null);
	}

	loadTokens();

	//Set the OAuth 2 access token
	oauth = yam.request.getAuthenticator();
	oauth.setAuthToken(accessTokens[networkPermalink]);

	loadNetworks();
	loadGroups();
	
	$('#settings').click(function() {
		$('#network').val($.cookie('networkPermalink'));

		var groupId = $.cookie('groupId');
		if (groupId!=null && isInt(groupId)) {
			$('#group').val(groupId);
		}
		$('#topic').val($.cookie('topicName'));
		$('#logoUrl').val($.cookie('logoUrl'));
		var color = $.cookie('color');
		if (color!=null) {
			$.farbtastic('#colorpicker').setColor($.cookie('color'));
		}
		$('#settings-dialog').dialog("open");
	});

	$('#network').bind('change', function() {
		oauth.setAuthToken(accessTokens[$('#network').val()]);
		loadGroups();
	});
	
	//Retrieve feed
	retrieveInitialFeed();
	
	//Start timer actions timers
	setInterval(timerHandler, showDelay);
}

function timerHandler() {
	if ((count % loadDelay)==0) {
		removeOffscreenMessages();
		var groupId = $.cookie('groupId');
		var topicId = $.cookie('topicId');
		if (groupId!=null && isInt(groupId) && groupId !=-1) {
			//Load group feed
			loadMessages('/api/v1/messages/in_group/' + groupId + '?newer_than=' +  lastMessageId);
		} else if (topicId!=null && isInt(topicId)) {
			//Load topic feed
			loadMessages('/api/v1/messages/about_topic/' + topicId + '?newer_than=' +  lastMessageId);
		} else {
			//Load All Company/Network feed
			loadMessages('/api/v1/messages?newer_than=' + lastMessageId);
		}
	}
	if ((count % showDelay)==0) {
		count = count + showDelay;
		var mes = $('.yam:hidden:last')[0];
		$('.yam:hidden:last').slideDown('slow');
		var mes2 = $('.yam:hidden:last')[0];
	}
}

function loadTokens() {
	yam.request({
		url: '/api/v1/oauth/tokens',
		type: 'GET',
		success: function (msg) { 
			$.each(msg, function(index, item) {
			if (accessTokens[item.network_permalink] == null) {
				accessTokens[item.network_permalink] = item;
				}
			});
		},
		error: function (msg) { error(msg); }
	});
}

function retrieveInitialFeed() {
	//Reset feed
	var lastMessageId = 0;
	$('#feed').html("");

	//Apply settings
	var groupId = $.cookie('groupId');
	var topicId = $.cookie('topicId');
	$('#feed-filter').html($.cookie('filterName'));
	var color = $.cookie('color');
	if (color != null) {
		$('body').css('background-color', color);
	}
	var logoUrl = $.cookie('logoUrl');
	if (logoUrl != null) {
		$('#header-logo').attr('src', logoUrl);
	} else {
		$('#header-logo').attr('src', 'images/Yammerfall_white.png');
	}

	
	if (groupId!=null && isInt(groupId) && groupId !=-1) {
		//Load group feed
		loadMessages('/api/v1/messages/in_group/' + groupId + '?limit=' +  messageLimit);
	} else if (topicId!=null && isInt(topicId)) {
		//Load topic feed
		loadMessages('/api/v1/messages/about_topic/' + topicId + '?limit=' +  messageLimit);
	} else {
		//Load All Company/Network Feed
		loadMessages('/api/v1/messages?limit=' + messageLimit);
	}
}

function loadMessages(apiUrl) {
	apiUrl = apiUrl;
	yam.request({
		url: apiUrl,
		type: 'GET',
		success: function (msg) { prependMessages(msg); },
		error: function (msg) { error(msg); }
	});
}

function prependMessages(response) {
	//Show feed
	var messages = parseMessages(response);
	var messageCount = messages.length;
	
	if (messageCount > 0) {
		//Load messages
		$('#messageTemplate').tmpl(messages, {
			dataArrayIndex: function (item) {
				return $.inArray(item, messages);
			}
		}).prependTo('#feed');

		//Truncate HTML
		$('.messagebody').truncate({max_length: 275});

		formatCreationDates();
		
		//Store lastMessageId
		lastMessageId = messages[0].id;
	}	
}

function parseMessages(response) {
	var users = {};
	var ref_msgs = {};
	
	for (i in response.references) {
		var r = response.references[i];
		if (r.type == 'user') {
			users[r.id] = r;
			users[r.name] = r;
		} else if (r.type == 'message') {
			ref_msgs[r.id] = r;
		}
	}
	
	for (i in response.messages) {
		var m = response.messages[i];
		if (m.sender_id != null) {
			m.mugshot_url = users[m.sender_id].mugshot_url.replace('48x48', '96x96');
			m.full_name = users[m.sender_id].full_name;
		}
		if (m.body.rich.indexOf('(See attached') === 0) {
			for (j in m.attachments) {
				var a = m.attachments[j];
				if (a.ymodule) {
					m.body.rich = a.name;
				}
			}
			
		}
		m.body.rich = m.body.rich.replace(/br><br/g, "br");
		/*if (m.body.rich.length > 250) {
			m.body.rich = m.body.rich.substring(0, 400) + "...";
		}*/
		/*m.liked_by_text = "";
		if (m.liked_by.count > 0) {
			for (j in m.liked_by.names) {
				if (j == 0) {
					m.liked_by_text = m.liked_by.names[j].full_name;
				} else if (j == m.liked_by.names.length-1) {
					m.liked_by_text = m.liked_by_text + " and " + m.liked_by.names[j].full_name;
				} else {
					m.liked_by_text = m.liked_by_text + ", " + m.liked_by.names[j].full_name;
				}
			}
			
			//m.liked_by_text = m.liked_by_text.substring(0, m.liked_by_text.length-2);
		}*/
		if (m.replied_to_id != null) {
			if (ref_msgs[m.replied_to_id] != null) {
				if (ref_msgs[m.replied_to_id].sender_id != null) {
					in_reply_to = users[ref_msgs[m.replied_to_id].sender_id];
					m.in_reply_to = in_reply_to.full_name;
				}
			} else {
				m.replied_to_id = null;
			}
		}
	}
	return response.messages;
}

function error(msg) {
	//alert("An error has occurred: " + msg.responseText);
}

function removeOffscreenMessages(){
	var screenHeight = $(window).height();
	
	$('.yam').each(function(){
		var item = $(this);
		var itemHeight = $(item).height();
		var topOffset = $(item).offset().top;
		
		if((itemHeight + topOffset) > screenHeight + 400) {
			$(item).animate({opacity: 0}, 500, function() {
				$(item).remove();
			})
		}
	})
}


function formatCreationDates() {
	$('.creationdate.unformatted').each(function(index) {
		var datestr = $(this).text()
		var dateOb = Date.parse(datestr);
		dateOb = dateOb.setTimezoneOffset(+0000);
		var newDateStr = "Posted at " + dateOb.toString('h:mm tt on dddd, MMMM d, yyyy');
		$(this).text(newDateStr);
		$(this).removeClass('unformatted');
	});
}

//Settings dialog methods
function loadNetworks() {
	//Load network options
	yam.request({
		url: '/api/v1/networks/current',
		type: 'GET',
		success: function (msg) { $('#network').addNetworks(msg); },
		error: function (msg) { error(msg); }
	});
}

function loadGroups() {
	//Load group options
	yam.request({
		url: '/api/v1/groups?mine=1',
		type: 'GET',
		success: function (msg) { $('#group').empty(); $('#group').addGroups(msg); },
		error: function (msg) { error(msg); }
	});
}

$.fn.addNetworks = function(data) {
	var list = this[0];
	$.each(data, function(index, item) {
		list.options.add(new Option(item.name, item.permalink));
	});
};

$.fn.addGroups = function(data) {
	var list = this[0];
	list.options.add(new Option("All Conversations", -1));
	$.each(data, function(index, item) {
		list.options.add(new Option(item.full_name, item.id));
	});
};

function isInt(x) { 
   var y=parseInt(x); 
   if (isNaN(y)) return false; 
   return x==y && x.toString()==y.toString(); 
}


function isUrl(str) {
	var v = new RegExp();
	v.compile("^[A-Za-z]+://[A-Za-z0-9-_]+\\.[A-Za-z0-9-_%&\?\/.=]+$");
	if (!v.test(str)) {
		return false;
	}
	return true;
}

function getOrCreateTopicId(topicName) {
	yam.request({
		url: '/api/v1/topics',
		type: 'POST',
		data: 'name=' + topicName,
		success: function (msg) { 
			storeTopicCookies(msg);
		},
		error: function (msg) { error(msg); }
	});
	
}

function storeTopicCookies(response) {
	$.cookie('filterName', '#'+response.name);
	$.cookie('topicId', response.id);
	$.cookie('topicName', response.name);
	$('#settings-dialog').dialog("close");
	retrieveInitialFeed();
}
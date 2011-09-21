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
	
	prepareSettingsDialog();
	
	$('#settings').click(function() {
		var groupId = $.cookie('groupId');
		if (groupId!=null && isInt(groupId)) {
			$('#group').val(groupId);
		}
		$('#settings-dialog').dialog("open");
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
		//var topicId = $.cookie('topicId');
		if (groupId!=null && isInt(groupId) && groupId !=-1) {
			//Load group feed
			loadMessages('/api/v1/messages/in_group/' + groupId + '?newer_than=' +  lastMessageId);
		/*} else if (topicId!=null && isInt(topicId)) {
			//Load topic feed
			loadMessages('/api/v1/messages/about_topic/' + topicId + '?newer_than=' +  lastMessageId);*/
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

function retrieveInitialFeed() {
	//Reset feed
	var lastMessageId = 0;
	$('#feed').html("");

	//Apply settings
	var groupId = $.cookie('groupId');
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

	//var topicId = $.cookie('topicId');
	if (groupId!=null && isInt(groupId) && groupId !=-1) {
		//Load group feed
		loadMessages('/api/v1/messages/in_group/' + groupId + '?limit=' +  messageLimit);
	/*} else if (topicId!=null && isInt(topicId)) {
		//Load topic feed
		loadMessages('/api/v1/messages/about_topic/' + topicId + '?limit=' +  messageLimit);*/
	} else {
		//Load All Company/Network Feed
		loadMessages('/api/v1/messages?limit=' + messageLimit);
	}
}

function loadMessages(apiUrl) {
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
		m.mugshot_url = users[m.sender_id].mugshot_url;
		m.full_name = users[m.sender_id].full_name;
		if(m.body.plain.length > 250) {
			m.body.plain = m.body.plain.substring(0, 400) + "...";
		}
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
			in_reply_to = users[ref_msgs[m.replied_to_id].sender_id];
			m.in_reply_to = in_reply_to.full_name;
		}
	}
	return response.messages;
}

function error(msg) {
	//alert(msg);
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
function prepareSettingsDialog() {
	//Load group options
	yam.request({
		url: '/api/v1/groups?mine=1',
		type: 'GET',
		success: function (msg) { $('#group').addItems(msg); },
		error: function (msg) { error(msg); }
	});
}

$.fn.addItems = function(data) {
	var list = this[0];
	list.options.add(new Option("All Conversations", -1));
	$.each(data, function(index, itemData) {
		list.options.add(new Option(itemData.full_name, itemData.id));
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

/*function updateTips( t ) {
	tips.text( t ).addClass( "ui-state-highlight" );
	setTimeout(function() {
		tips.removeClass( "ui-state-highlight", 1500 );
	}, 500 );
}

function checkBothNotFilled(group, topic) {
	if (group.val()!=-1 && topic.val().length>0) {
	updateTips("Please select either a group or a topic, but not both.")
		return false;
	} else {
		return true;
	}
}

function getOrCreateTopicId(topic) {
	yam.request({
		url: 'api/v1/topics?name=' + topic.val(),
		type: 'POST',
		data: 'name=' + topic.val();
		success: function (msg) { storeTopicId(msg); },
		error: function (msg) { error(msg); }
	});
}

function storeTopicId(response) {
	$.cookie('topicId', response.id);
}*/
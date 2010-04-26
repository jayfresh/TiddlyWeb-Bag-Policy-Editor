$.ajax_orig = $.ajax;
$.ajax = function() {
	if(window.Components && window.netscape && window.netscape.security && document.location.protocol.indexOf("http") == -1) {
		window.netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead");
	}
	$.ajax_orig.apply(this,arguments);
};

var makeBagList = function($node, bags) {
	var list = "<ul></ul>";
	$.each(bags, function(i, bag) {
		list += "<li><a href='"+bag+"'>" + bag + "</a></li>";
	});
	$node.empty();
	$(list).appendTo($node);
};

var loadPolicy = function($node, bag) {
	$('#result').empty();
	var policy = bag.policy;
	$.each(policy, function(key, value) {
		var $node = $('#'+key);
		if($node.length) {
			$node.val(value.toString());
		}
	});
	$node.val(bag.policy);
};

var tw = {};

$(document).ready(function() {
	
	var $hostInput = $('#host');
	$hostInput.val('http://hoster.peermore.com');
	
	var policyEditorOrigVal = $('#policyEditor input[type=submit]').val();
	
	$('#loginStatus').click(function(e) {
		e.preventDefault();
		$.ajax({
			url: $hostInput.val()+"/status",
			success: function(data, status, xhr) {
				$('#loginStatus span')
					.removeClass("error")
					.text("logged in as: "+data.username);
			},
			error: function(xhr, status, error) {
				$('#loginStatus span')
					.addClass("error")
					.text("error getting status from "+url);
			},
			dataType: "json"
		});
	});
	
	$('#config form').submit(function(e) {
		e.preventDefault();
		tw.bags = new tiddlyweb.Resource('bags', $hostInput.val());
		tw.bags.get(function(resource, status, xhr) {
			makeBagList($('#bagList'), resource);
		}, function(xhr, error, exc, self) {
			console.log("error",this,arguments);		
		});
	});
	
	$('#bagList a').live('click', function(e) {
		e.preventDefault();
		$('#bagList .error').remove();
		var bag = $(this).attr('href');
		var that = this;
		tw.bag = new tiddlyweb.Bag(bag, $hostInput.val());
		tw.bag.get(function(resource, status, xhr) {
			loadPolicy($('#policyEditor textarea'), resource);
			$('#policyEditor input[type=submit]').val(policyEditorOrigVal+" for "+bag);
			$(window).scrollTop(0);
		}, function(xhr, error, exc, self) {
			$(that).after("<span class='error'>"+xhr.responseText+"</span>");
		});
	});
	
	$('#policyEditor').submit(function(e) {
		e.preventDefault();
		// rebuild policy object from inputs
		var policy = {};
		$('#policyEditor input[type=text]').each(function(i, input) {
			var $input = $(input);
			var value = $input.val();
			var key = $(input).prev().text(); // the label
			policy[key] = value ? value.replace(/ /g,"").split(",") : [];
		});
		tw.bag.policy = policy;
		tw.bag.put(function(data, status, xhr) {
			if(status==="success") {
				$('#result')
					.removeClass("error")
					.text(status);
			}
		}, function(xhr, error, exc, self) {
			$('#result')
				.addClass("error")
				.text(xhr.responseText || error);
			console.log(xhr, error, exc, self);
		});
	});
	
	$('input[type=text]').bind("focus", function() {
		$(this).toggleClass('currentFocus');
	}).bind("blur", function() {
		$(this).toggleClass('currentFocus');
	});
});
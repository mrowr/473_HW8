// Client-side code
/* jshint browser: true, jquery: true, curly: true, eqeqeq: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, nonew: true, quotmark: double, strict: true, undef: true, unused: true */

function shorten() {
	"use strict";
	$("#generate").on("click", function() {
		var input_url = $("#url").val();
		var urlInfo = {"url": input_url};
		$.post("/shorten", urlInfo, function(res) {
			var output_url = $("<p>").html(res.result);
			$("#result").empty();
			$("#result").append(output_url);
		});
	});
}

function view() {
	"use strict";
	$("#popular").on("click", function() {
		var list, link, tag;
		list = $("<ol>");
		$("#top10").empty();
		$.getJSON("/top10", function(res) {
			for (var i = 0; i < res.length; i++) {
				link = $("<li>");
				tag = $("<a>");
				tag.attr("href", res[i].short);
				tag.text(res[i].short);
				link.append(tag);
				list.append(link.append(" : " + res[i].count));
			}
			$("#top10").append(list);
		});
	});
}

var main = function() {
	"use strict";
	shorten();
	view();
};

$(document).ready(main);
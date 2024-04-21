var Search = function (options) {
	/* DOM elements */
	this.template = document.querySelector(options.template);
	this.target_id = options.target || "#gn_card_list";
	this.target_element = document.querySelector(this.target_id);
	this.total_count_element = document.querySelector("#total_count");
	this.page_element = document.querySelector("#current-page");
	this.numpages_element = document.querySelector("#numpages");

	/* Variables */
	this.url = options.url || SEARCH_URL;
	this.total_count = 0;
	this.page = 1;
	this.numpages = 1;
	this.prev_url = null;
	this.next_url = null;
};

/**
 * Get a template from a string
 * https://stackoverflow.com/a/41015840
 * @param  {String} str    The string to interpolate
 * @param  {Object} params The parameters
 * @return {String}        The interpolated string
 */
Search.prototype.interpolate = function (str, params) {
	let names = Object.keys(params);
	let vals = Object.values(params);
	return new Function(...names, `return \`${str}\`;`)(...vals);
};

Search.prototype.fetch = function () {
	var self = this;
	var query_string = new URLSearchParams(window.location.search);
	$.ajax({
		url: self.url,
		data: Object.fromEntries(query_string),
		success: function (data) {
			const { meta, objects } = data;
			self.update(meta);
			self.show_results(objects);
		},
	});
};

Search.prototype.next_page = function () {
	var self = this;
	if (self.next_url) {
		$.ajax({
			url: self.next_url,
			success: function (data) {
				const { meta, objects } = data;
				self.update(meta);
				self.show_results(objects);
			},
		});
	}
	return false;
};

Search.prototype.previous_page = function () {
	var self = this;
	if (self.prev_url) {
		$.ajax({
			url: self.prev_url,
			success: function (data) {
				const { meta, objects } = data;
				self.update(meta);
				self.show_results(objects);
			},
		});
	}
	return false;
};

Search.prototype.update = function (meta) {
	var self = this;
	if (meta) {
		const { total_count, offset, limit, previous, next } = meta;
		self.total_count = total_count;
		self.page = Math.round(offset / limit + 1);
		self.numpages = Math.round(total_count / limit + 0.49);
		self.prev_url = previous;
		self.next_url = next;
	}
};

Search.prototype.show_results = function (data) {
	var self = this;
	let html = "";

	/*Update results grid*/
	for (let object of data) {
		html += self.interpolate(self.template.innerHTML, { object });
	}
	self.target_element.innerHTML = html;

	/* update pagination */
	self.total_count_element.innerHTML = self.total_count;
	self.page_element.innerHTML = self.page;
	self.numpages_element.innerHTML = self.numpages;
};

function query_api(query) {
	var limit = query["limit"] || CLIENT_RESULTS_LIMIT;
	var offset = query["offset"] || 0;
	var order_by = query["order_by"];

	query["limit"] = limit;
	query["offset"] = offset;
	if (order_by) {
		query["order_by"] = order_by;
	}
	const url = new URL(window.location);
	for (let key of Object.keys(query)) {
		url.searchParams.set(key, query[key]);
	}
	window.history.replaceState({}, "", url);
	SEARCH_HELPER.fetch();
}

$("#text_search_btn").click(function () {
	var query = {};

	if (HAYSTACK_SEARCH) {
		query["q"] = $("#text_search_input").val();
	} else {
		if (AUTOCOMPLETE_URL_RESOURCEBASE == "/people/autocomplete/") {
			// updated url to work with new autocomplete backend format
			// a user profile has no title; if search was triggered from
			// the /people page, filter by username instead
			var query_key = "username__icontains";
		} else if (
			AUTOCOMPLETE_URL_RESOURCEBASE == "/groups/autocomplete_category/"
		) {
			// Adding in this conditional since both groups autocomplete and searches requests need to search name not title.
			var query_key = "name__icontains";
		} else if (AUTOCOMPLETE_URL_RESOURCEBASE == "/groups/autocomplete/") {
			// Adding in this conditional since both groups autocomplete and searches requests need to search name not title.
			var query_key =
				$("#text_search_input").data("query-key") || "title";
		} else {
			var query_key =
				$("#text_search_input").data("query-key") || "title__icontains";
		}
		if ($("#text_search_input").val()) {
			query[query_key] = $("#text_search_input").val();
		}
	}
	if ($("#text_search_input").val() || $("#text_search_input").val()) {
		query["abstract__icontains"] = $("#text_search_input").val();
		query["purpose__icontains"] = $("#text_search_input").val();
		query["f_method"] = "or";
	}
	query_api(query);
});

$("#region_search_btn").click(function () {
	if ($("#region_search_input").val()) {
		query["regions__name__in"] = $("#region_search_input").val();
	}
	query_api(query);
});

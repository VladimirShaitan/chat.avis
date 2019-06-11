let qs = function(selector) {
	return document.querySelector(selector);
}

HTMLElement.prototype.qs  = function(selector){
	return this.querySelector(selector);
}

let qsa = function(selector) {
	return document.querySelectorAll(selector);
}
HTMLElement.prototype.qsa  = function(selector){
	return this.querySelectorAll(selector);
}


HTMLElement.prototype.parentFinder = function(clName){
	if(this.classList.contains(clName)){
		return this;
	} else {
		if(this.parentElement != null){
			return this.parentElement.parentFinder(clName);			
		}
	}
}

function ajax_handler(action_obj, callback){
	jQuery.post(ajaxurl, action_obj, function(data){
		callback(data);
	});
}
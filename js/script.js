var urlParams = new URLSearchParams(window.location.search);
const user_defaults = {
	chat_id: atob(urlParams.get('chat')),
	language: navigator.language.split('-')[0]
}
// coockies.set('user_defaults', btoa(JSON.stringify(user_defaults)))


const site_defaults = {
	language: {
		langs: ['en', 'fr', 'ru'],
		default_lang: 'en',
		translations_folder: '../translation/',
		translation_format: '.json',  
		get_translation_path: function(lang_index) {
			if(lang_index){
				return this.translations_folder+lang_index+this.translation_format;
			} else {
				return this.translations_folder+this.default_lang+this.translation_format;
			}
		}
	}
}

function get_translations(lang){
	var lang_index = site_defaults.language.default_lang;
	if(lang && (site_defaults.language.langs.indexOf(lang) != -1) ){
		lang_index = lang;		 
	} else {
		if(site_defaults.language.langs.indexOf(user_defaults.language) != -1){
			lang_index = user_defaults.language;
		}
	}
	var tr_path = site_defaults.language.get_translation_path(lang_index);
	return axios.get(tr_path);
} 

var lang = new Vue({
	el: '#lang_choice',
	data: {
		langs: site_defaults.language.langs,
		current_lang: '',
	},
	created: function(){
		if(coockies.get('lang') === undefined){
			get_translations()
				.then((resp) => {
					chat._data.lang = resp.data;
					this.current_lang = resp.data.lang;
					coockies.set('lang', user_defaults.language);
				});
		} else {
			get_translations(coockies.get('lang'))
				.then((resp) => {
					chat._data.lang = resp.data;
					this.current_lang = resp.data.lang;
				});
		}
	},
	methods: {
		changeLang: function(e){
			get_translations(e.target.value)
				.then(function(resp){
					chat._data.lang = resp.data
					coockies.set('lang', resp.data.lang);
					this.current_lang = resp.data.lang;
				})
		}
	},
})


var chat = new Vue({
	el: '#chat',
	data: {
		logo: '',
		brName: '',
		userName: '',
		messages: [],
		topic: '',
		sender: '',
		lang: {}
	}, 
	created: function() {
		axios.get('http://qrticket-env.pymmzmsf4z.eu-west-3.elasticbeanstalk.com/api/v0/chat/getChatHistoryWeb/'+user_defaults.chat_id).then((resp) => {
			this.messages = resp.data.conversations;
			this.topic = resp.data.topic;
			this.brName = resp.data.branchName;
			this.userName = resp.data.name;
			this.logo = resp.data.imgUrl;
			this.sender = resp.data.sender;

			setTimeout(function(){
				VueScrollTo.scrollTo('.end', 300, {container: '.chat-body', force: true});
			}, 100);
		});		
	},
	methods:{
		sendMessage: function(e){
				e.preventDefault();
				let message = e.target.querySelector('input[type="text"]').value;
				if(message != ''){
				   e.target.reset();
				   message_handler.send_message(message);
				}
		}
	},
})



var rev_id = user_defaults.chat_id;
var client;
connect();
let message_handler = {
	send_message: function(mes){
		chat.messages.push({message: mes, messageSender: chat.topic});

		let obj = {
			content: mes,
			messageType:"CHAT",
			reviewId: rev_id,
			sender: chat.sender
		};

		client.send("/app/chat/"+chat.topic+"/sendMessage", {priority: 9}, JSON.stringify(obj));
		VueScrollTo.scrollTo('.end', 300, {container: '.chat-body', force: true});
	},


	receive_message: function(mes){
		chat.messages.push({message: mes, messageSender: ''});
		VueScrollTo.scrollTo('.end', 300, {container: '.chat-body', force: true});
	},	

	// construct_message: function(from, mes){
	// 	let div = document.createElement('div');
	// 	div.className = 'message-wrapper ' + from;
	// 	let template = '<div class="message-wrapper '+from+'"><div class="message">'+mes+'</div></div>';
	// 	div.innerHTML = template; 
 //        return div;
	// }
}


function connect(){	
	client = Stomp.client('ws://qrticket-env.pymmzmsf4z.eu-west-3.elasticbeanstalk.com/ws/websocket');

	client.ws.addEventListener('open', function(){
		console.log('connection open');
		       
   		let obj_ping = {
			content: 'User connected',
			messageType:"CHAT",
			reviewId: rev_id,
			sender: chat.sender
		};

		client.send("/app/chat/online/connectUser", {priority: 9}, JSON.stringify(obj_ping));
	});
	client.ws.addEventListener('close', function(){
		console.log('closed connection');
		connect();
	});

	var destination = '/channel/'+rev_id;


	client.connect('', '', function(frame) {
       client.debug("connected to Stomp");
       client.subscribe(destination, function(message) {
		 let mes = JSON.parse(message.body).content;
		 message_handler.receive_message(mes);

       });
     }, function(error) {
        console.log("STOMP protocol error " + error);
}, function(){console.log('connection closed')});
	return client;
}
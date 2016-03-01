"use strict";
var restler = require('restler');
var snClient = restler.service(
	function(config){
		this.config = config;
		
		var auth = new Buffer(config.auth,"base64").toString().split(":");
		this.defaults.username = auth[0];
		this.defaults.password = auth[1];
		
		this.defaults.headers = {
			'Content-Type': 'application/json',
			'Accepts': 'application/json'
		};
		this.baseURL = "https://" + config.host;
		
		
	},
	{
		
	},
	{
		getRecords : function(table,query){
			return this.get(this.baseURL + "/api/now/table/" + table + '?sysparm_query=' + query);
		},
		postRecord : function(table,data){
			return this.post(this.baseURL + "/table/" + table,{
				data : JSON.stringify(data)
			});
		},

	});

module.exports = snClient;

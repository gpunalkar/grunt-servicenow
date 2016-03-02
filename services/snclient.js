"use strict";
var http = require('http');
var restler = require('restler');
var url = require('url');
var util = require('util');

module.exports = restler.service(
	function(config){

		var auth = new Buffer(config.auth,"base64").toString(),
			parts = auth.split(":"),
			username = parts[0],
			password = parts[1],
			clientOptions = {
				baseURL : "https://" + config.host
			};
		
		var headers = {
			'Content-Type': 'application/json',
			'Accepts': 'application/json'
		};
		
		this.baseURL = clientOptions.baseURL;
		
		this.defaults.username = username;
		this.defaults.password = password;
		this.defaults.headers = headers;
		
		
		
	},
	{
		
	},
	{
//		getRecords : function(table,query){
////			console.log(this.baseURL + "/api/now/table/" + table + "?sysparm_query=" + query);
//			return this.get(this.baseURL + "/api/now/table/" + table + "?sysparm_query=" + query);
//		}
		table : function table(tableName) {
			var client = this;
			
			function validateResponse(result, res) {
//				logResponse(result, res);
				
				var help = '';

				if(result instanceof Error) {
					var errorlist = {
						'ECONNREFUSED': 'Missing interent connection or connection was refused!',
						'ENOTFOUND': 'No connection available (do we have internet?)',
						'ETIMEDOUT': 'Connection timed out. Internet down?'
					};

					help = errorlist[result.code] || "Something failed badly.. internet connectiond own?";

					help += util.format('\ndetails: %j', result);
					
					console.warn(help);
					console.error(result);
					
					return new Error(help);
				}
				
				if (res.statusCode !== 200) {

					if (res.statusCode === 401) {
					  help = 'Check credentials.';
					} else if (res.statusCode === 302) {
					  help = 'Verify JSON Web Service plugin is activated.';
					}

					var message = util.format('%s - %s', res.statusCode, http.STATUS_CODES[res.statusCode]);
					if (help) {
					  message += ' - ' + help;
					}
					if (result instanceof Error) {
					  message += util.format('\ndetails: %j', result);
					}
					return new Error(message);
				}
				
				if (result instanceof Error) {
					return result;
				}
				if (result.error) {
					console.error('ERROR found in obj.error : ', result.error);
					// DP TODO : Investigate: Error: json object is null
					return new Error(result.error);
					// this is actually not an error! It's just that the server didn't return anything to us
					//return null;
				}
				if (!result.records) {
					return new Error(util.format('Response missing "records" key: %j\nCheck server logs.', result));
				}
				return null;
			}
			
			function logResponse(result, res){
				 var resCode = res ? res.statusCode : 'no response';
				console.error('-------------------------------------------------------');
				console.error(res);
				console.error('-------------------------------------------------------');
			}
			
			function send(request){
				var maxRecords = request.rows || 1;
				var urlObj = {
					pathname: '/api/now/table/' + request.table,
					query : {
						sysparm_record_count : maxRecords,
					}
				};
				if(request.parmName){
					urlObj.query['sysparm_' + request.parmName] = request.parmValue;
				}
				
				var path = url.format(urlObj);
				console.log(client.baseURL + path);
//				console.debug('snc-client send() path: ' + path);
				
				function handleResponse(result, res){
					var err = validateResponse(result, res, request);
					request.callback(err, result);
				}
				try {
					if (request.postObj){
						client.post(path, {data: JSON.stringify(request.postObj)}).on("complete",handleResponse);
					}
					else{
	client.get(path).on("complete",handleResponse);
						
					}
				} catch(err){
					console.error("Some connection error happened...",err);
					process.exit(1);
				}
			}
			
			function getRecords(query, callback) {
				
				var parms = {
					table: tableName,
					parmName : 'query',
					parmValue : query,
					rows : 50,
					callback : callback
				};
				
				send(parms);
			}
			
			return {
				getRecords : getRecords
			};
			
		}
	});

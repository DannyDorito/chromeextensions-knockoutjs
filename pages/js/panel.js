$(function () {
	//abstraction wrapper around extension api, stolen from batarang :)
	const chromeExtension = {
		sendRequest: function (requestName, cb) {
			chrome.runtime.sendMessage({
				script: requestName,
				tab: chrome.devtools.inspectedWindow.tabId
			}, cb || function () { });
		},

		eval: function (fn, args, cb) {
			// with two args
			if (!cb && typeof args === 'function') {
				cb = args;
				args = {};
			} else if (!args) {
				args = {};
			}
			chrome.devtools.inspectedWindow.eval('(' +
				fn.toString() +
				'(window, ' +
				JSON.stringify(args) +
				'));', cb);
		},
		watchRefresh: function (cb) {
			const port = chrome.runtime.connect();
			port.postMessage({
				action: 'register',
				inspectedTabId: chrome.devtools.inspectedWindow.tabId
			});
			port.onMessage.addListener(function (msg) {
				if (msg === 'refresh' && cb) {
					cb();
				}
			});
			port.onDisconnect.addListener(function (a) {
				console.log(a);
			});
		}
	};
	const attachLoggingExtender = function (globalWindowObj) {
		try {

			//require js support
			let ko = window.ko;
			if (!ko) {
				if (typeof window.require === 'function') {
					try {
						ko = require('ko');
					} catch (e) { /*ignore */ }
					if (!ko) {
						try {
							ko = require('knockout');
						} catch (e) { /*ignore */ }
					}
				}
				if (!ko) {
					return;
				}
			}

			//create the extender in the context of the page
			const chromeExtensionLogChangeFun = function (target, option) {
				const indent = "   ";
				let total = "";
				for (let i = 0; i < option.nestingLevel; i++) {
					total += indent;
				}

				target.subscribe(function (newValue) {
					console.debug(total, option.propName, newValue);
					console.timeStamp(option.propName + " changed (ko)");
				});
				return target;
			};
			ko.extenders.ChromeExtensionLogChange = chromeExtensionLogChangeFun;


			//crazy code that will loop all nodes an get all the knockout bound viewmodels on a page
			const viewModels = [];
			const items = document.getElementsByTagName("*");
			for (let i = 0; i < items.length; i++) {
				try {
					const theContextFor = ko.contextFor(items[i]);
					const theVm = theContextFor.$data;
					const theNestingLevel = theContextFor.$parents.length;
					let isAlreadyInArray = false;
					for (let j = 0; j < viewModels.length; j++)
						if (viewModels[j].viewmodel == theVm)
							isAlreadyInArray = true;
					if (!isAlreadyInArray)
						viewModels.push({ viewmodel: theVm, level: theNestingLevel });
				}
				catch (toBeIgnoredExc) { }
			}

			if (!viewModels.length) {
				return;
			}
			//add extender to each observable/array/computed that will log changes
			for (let k = 0; k < viewModels.length; k++) {
				const tempVm = viewModels[k].viewmodel;
				const nestingLevel = viewModels[k].level;
				for (const vmProperty in tempVm) {
					try {
						if (!tempVm.hasOwnProperty(vmProperty))
							continue;
						if (tempVm[vmProperty] === null || tempVm[vmProperty] === undefined)
							continue;
						if (!ko.isSubscribable(tempVm[vmProperty]))
							continue;
						tempVm[vmProperty].extend({ ChromeExtensionLogChange: { propName: vmProperty, nestingLevel: nestingLevel } });
					}
					catch (unableToExtendException) {
						console.log("Unable to extend the viewmodel", vmProperty, tempVm);
					}
				}
			}
		}
		catch (err) {
			console.error(err);
		}
	};

	const chromeExtensionEvalCallback = function (promise) {
		//disable the button so you can only attach the extender once
		$("#enableTracing").text("Tracing enabled").attr("disabled", "disabled");
	};

	$("#enableTracing").click(function () {
		chromeExtension.eval(attachLoggingExtender, true, chromeExtensionEvalCallback);
	});
	chromeExtension.watchRefresh(function () {
		$("#enableTracing").text("Enable Tracing").removeAttr("disabled");
	});
});

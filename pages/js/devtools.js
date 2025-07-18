// The function is executed in the context of the inspected page.
const page_getKnockoutInfo = function (shouldSerialize) {
	"use strict";
	/**
	 * Print to console a disclaimer that
	 * no knockout instance was found on a page
	 * reprints to console on every failed inspection (if no ko found)
	 */
	function knockoutNotFoundDisclaimer() {
		// knockout not found in any way
		const label = "Knockoutjs Context Debugger: Knockout.js not found"
		console.group(label)
		console.info(
			"Knockout.js was not found at global context (window.ko) nor through require.js (require.defined('ko')/require.defined('knockout')).",
			"Maybe you are using iFrames, if so, browse to the url of the frame and try again.",
			"If you are using ECMA module imports, make sure knockout is available at global context with:"
		)
		console.log(`
            import ko from "knockout"
            ...
            window.ko = ko;
        `)
		console.groupEnd(label)
	};

	const debug = function (m) {
		//console.log(m);
	};
	let ko = window.ko;

	if (!ko && typeof window.knockout !== "undefined") {
		ko = window.knockout;
	}

	if (!ko) {
		// try fetching ko with requirejs
		if (typeof window.require === 'function') {
			const isDefinedAvailable = typeof window.require.defined === 'function';
			try {
				if ((isDefinedAvailable && require.defined('ko')) || !isDefinedAvailable) {
					ko = require('ko');
				}
			} catch (e) { /*ignore */ }
			if (!ko) {
				try {
					if ((isDefinedAvailable && require.defined('knockout')) || !isDefinedAvailable) {
						ko = require('knockout');
					}
				} catch (e) { /*ignore */ }
			}
		}
		// could not find ko library instance with window nor require.
		// Then fallback to this message, print to console
		if (!ko) {
			knockoutNotFoundDisclaimer()
			return { error: "Knockout.js was not found at global context (window.ko/window.knockout) nor through require.js (require.defined('ko')/require.defined('knockout')). For details please see console output." };
		}
	}

	const isString = function (obj) {	// _ implementation
		return toString.call(obj) == '[object String]';
	};

	function isFunction(functionToCheck) {
		const getType = {};
		const res = functionToCheck && getType.toString.call(functionToCheck) == '[object Function]';
		return res;
	}

	let i = 0;
	// Make a shallow copy with a null prototype, don't show prototype stuff in panel
	const copy = { __proto__: null };
	const copy2 = { __proto__: null };
	debug($0);
	const context = $0 ? ko.contextFor($0) : {};
	debug("context ");
	debug(context);

	try {
		const props = Object.getOwnPropertyNames(context);
		for (i = 0; i < props.length; ++i) {
			//you probably want to see the value of the index instead of the ko.observable function
			if (props[i] === "$index") {
				copy["$index()"] = ko.utils.unwrapObservable(context[props[i]]);
			}
			else if (props[i] === "$root") {
				if (context[props[i]] != window) {
					try {
						if (shouldSerialize) {
							copy["$root_toJS"] = ko.toJS(context[props[i]]);
						}
						else {
							copy["$root"] = context[props[i]];
						}
					}
					catch (toJsErr) {
						copy["$root_toJS"] = "Error: ko.toJS(" + props[i] + ")";
						copy["$root_toJS_exc"] = toJsErr;
					}
				}
				else {
					copy["$root"] = "(Global window object)";
				}
			}
			else {
				if (props[i] === "$cell") {//repeat binding support
					copy[props[i]] = shouldSerialize ? ko.toJS(context[props[i]]) : ko.utils.unwrapObservable(context[props[i]]);
				}
				else {
					copy[props[i]] = ko.utils.unwrapObservable(context[props[i]]);
				}
			}
		}
	}
	catch (err) {
		//when you don't select a dom node but plain text  (rare)
		debug(err);
		return { info: "Please select a dom node with ko data.", ExtensionError: err };
	}

	try {
		const dataFor = $0 ? ko.dataFor($0) : {};
		const data = shouldSerialize ? ko.toJS(dataFor) : ko.utils.unwrapObservable(dataFor);

		if (isString(data)) {	//don't do getOwnPropertyNames if it's not an object
			copy["vm_string"] = data;
		}
		else {
			try {
				const props2 = Object.getOwnPropertyNames(data);
				for (i = 0; i < props2.length; ++i) {
					//create a empty object that contains the whole vm in a expression. contains even the functions.
					copy2[props2[i]] = ko.utils.unwrapObservable(data[props2[i]]);
					//show the basic properties of the vm directly, without the need to collapse anything
					if (shouldSerialize) {//if you don't serialize, the isFunction check is useless cause observables are functions
						if (!isFunction(data[props2[i]])) {
							//chrome sorts alphabetically, make sure the properties come first
							copy[props2[i]] = data[props2[i]];
						}
					}
					else {
						copy[props2[i]] = ko.utils.unwrapObservable(data[props2[i]]);
					}
				}
				//set the whole vm in a expression (collapsable). contains even the functions.
				copy["vm_toJS"] = copy2;

			}
			catch (err) {
				//I don't know the type but I'll try to display the data
				copy["vm_no_object"] = data;
			}
		}
	}
	catch (error) {
		copy["error"] = error;
	}
	const ordered = {};

	Object.keys(copy).sort().forEach(function (key) {
		ordered[key] = copy[key];
	});

	return ordered;
};

const createEditMethods = function () {
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
	try {
		window.editBinding = (function () {
			return ko.bindingProvider.instance.getBindings($0, ko.contextFor($0));
		}).bind(console)();

		window.edit$data = (function () {
			return ko.contextFor($0).$data;
		}).bind(console)();

		window.edit$root = (function () {
			return ko.contextFor($0).$root;
		}).bind(console)();
	}
	catch (e) {
	}
};
const pluginTitle = "Knockout context";
let shouldDoKOtoJS = true;
const localStorageError = "Unable to get value from localstorage. Check the privacy settings of chrome";
try {
	const shouldDoKOtoJSValue = localStorage["shouldDoKOtoJS"];
	if (shouldDoKOtoJSValue)
		shouldDoKOtoJS = JSON.parse(shouldDoKOtoJSValue);
}
catch (e) {
	console.log(localStorageError, e);
}


let shouldAddEditMethodsValue = undefined;
let shouldAddEditMethod = false;
try {
	shouldAddEditMethodsValue = localStorage["shouldAddEditMethods"];
	if (shouldAddEditMethodsValue)
		shouldAddEditMethod = JSON.parse(shouldAddEditMethodsValue);
}
catch (e) {
	console.log(localStorageError, e);
}


chrome.devtools.panels.elements.createSidebarPane(pluginTitle, function (sidebar) {
	"use strict";
	function updateElementProperties() {
		//pass a function as a string that will be executed later on by chrome
		sidebar.setExpression("(" + page_getKnockoutInfo.toString() + ")(" + shouldDoKOtoJS + ")");


		if (shouldAddEditMethod) {
			chrome.devtools.inspectedWindow.eval("(" + createEditMethods.toString() + ")()");
		}
	}
	//initial
	updateElementProperties();
	//attach to chrome events so that the sidebarPane refreshes (contains up to date info)
	chrome.devtools.panels.elements.onSelectionChanged.addListener(updateElementProperties);
	sidebar.onShown.addListener(updateElementProperties);

	//listen to a message send by the background page (when the chrome windows's focus changes)
	chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
		updateElementProperties();
	});
});


let localStorageValue = undefined;
try {
	localStorageValue = localStorage["shouldPanelBeShown"];
}
catch (e) {
	console.log(localStorageError, e);
}
let shouldPanelBeShown = true;
if (localStorageValue)
	shouldPanelBeShown = JSON.parse(localStorageValue);
if (shouldPanelBeShown) {
	const knockoutPanel = chrome.devtools.panels.create(
		"KnockoutJS",
		"logo.png",
		"/pages/panel.html"
	);
}

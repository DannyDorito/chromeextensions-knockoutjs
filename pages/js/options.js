$(function () {
	const shouldPanelBeShownKey = "shouldPanelBeShown";
	const shouldDoKOtoJSKey = "shouldDoKOtoJS";
	const shouldAddEditMethodsKey = "shouldAddEditMethods";

	const restorePreviousSettings = function () {

		const checkBoxes = [
			{ settingKey: shouldPanelBeShownKey, domSelector: "#shouldPanelBeShownCheckbox", defaultValue: true },
			{ settingKey: shouldDoKOtoJSKey, domSelector: "#shouldDoKOtoJSCheckbox", defaultValue: true },
			{ settingKey: shouldAddEditMethodsKey, domSelector: "#shouldAddEditMethodsCheckbox", defaultValue: false },
		];
		$.each(checkBoxes, function (i, val) {
			const localStorageValue = localStorage[val.settingKey];
			if (localStorageValue) {
				const settingValue = JSON.parse(localStorageValue);
				$(val.domSelector).attr('checked', settingValue);
			}
			else {
				$(val.domSelector).prop('checked', val.defaultValue);
			}
		});
	};

	const setValueSafelyInLocalStorage = function (key, notStringifiedValue) {
		try {
			localStorage[key] = JSON.stringify(notStringifiedValue);
			$("#infoMessage").closest(".alert").removeClass("alert-danger");
			$("#infoMessage").closest(".alert").find("h4").text("Saved");
			return true;
		}
		catch (e) {
			$infoMessage.html("Unable to change the setting. Probably because you have blocked localstorage/cookies in the privacy settings of Chrome.");
			$("#infoMessage").closest(".alert").removeClass("alert-success").addClass("alert-danger");
			$("#infoMessage").closest(".alert").find("h4").text("Error");
			return false;
		}
	};

	restorePreviousSettings();

	const $infoMessage = $("#infoMessage");
	//when checkbox changes, directly save value in localstorage
	$("#shouldPanelBeShownCheckbox").change(function () {
		$(".alert").removeClass("d-none");
		const el = $(this);
		const val = el.is(':checked');
		if (setValueSafelyInLocalStorage(shouldPanelBeShownKey, val)) {
			if (val) {
				$infoMessage.html("Happy tracing");
			}
			else {
				$infoMessage.html("If you disabled it because it didn't worked for you, please file a bug on the <a href='https://github.com/timstuyckens/chromeextensions-knockoutjs'>github page </a>");
			}
		}
	});

	$("#shouldDoKOtoJSCheckbox").change(function () {
		const el = $(this);
		const val = el.is(':checked');
		setValueSafelyInLocalStorage(shouldDoKOtoJSKey, val);
	});

	$("#shouldAddEditMethodsCheckbox").change(function () {
		const el = $(this);
		const val = el.is(':checked');
		setValueSafelyInLocalStorage(shouldAddEditMethodsKey, val);
	});

});

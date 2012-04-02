//todo: function to replace the content of an already existing form with the values of a JS variable
//todo: define the maximum level allowed to be added to the form
//todo: define that the form is fixed, no field, subfields whatever can be deleted and the names can not be changed
//todo: rename the class names to ui-jsonedit-XXXX
//todo: rename this file to jsonedit.js
(function($) {

	$.fn.jsonedit = function(options) {
		var settings = $.extend({
			title : '',
			id : null,
			data : null,
			callback : null,

			// classes in css are not defined, default styles have to be applied
			css : false
		}, options);
		return this.each(function() {
			new $_($(this), settings);
		});
	};
	function $_(node, args) {
		var _this = this;

		// The default styles that are applied unless the user does not specify
		// 'css:true'
		var defaultStyles = '<style type="text/css" id="jsonedit-default-style">'
				+ '.record{border:solid gray 1px;}'
				+ '.array{border:solid grey 1px;}'
				+ '.field{border-radius:5px;padding:2pt;margin:10px;}'
				+ '.inputTextFieldValue{border:solid 1px;border-radius:2px;margin-left:5px;box-shadow:3px 3px 2px 2px #ccc;}'
				+ '.inputTextFieldName{	border:solid 1px;border-radius:2px;box-shadow:3px 3px 2px 2px #ccc;}'
				+ '.title{font-family:Arial;font-size:20pt;font-weight:bold;}'
				+ '.icon{position:relative;top:6px;margin-right:3px;margin-bottom:4px}'
				+ '.toggleIcon{position:relative;top:3px;margin-right:3px;margin-bottom:4px}'
				+ '.toggleIconsIcon{position:relative;top:6px;margin-right:3px;margin-bottom:6px}'
				+ '.recordDecoratorIcon{position:relative;top:6px;margin-right:3px;margin-bottom:4px}'
				+ '.deleteIcon{margin-left:4px;margin-bottom:4px}' + '</style>';

		var toggleIconsIcon = '<img src="icon/show_hide.png" class="toggleIconsIcon" title="show-hide form icons"/>';
		var recordDecoratorIcon = '<img src="icon/record.png" class="recordDecoratorIcon" title="map"/>';
		var arrayDecoratorIcon = '<img src="icon/array.png" class="recordDecoratorIcon" title="array"/>';
		var collapseIconFile = "icon/collapse.png";
		var expandIconFile = "icon/expand.png";
		var collapseIcon = '<img src="' + collapseIconFile
				+ '" class="toggleIcon" title="collapse"/>';

		var fieldDeleteIcon = '<img src="icon/delete.png" class="deleteIcon icon" title="delete"/>';
		var recordDeleteIcon = '<img src="icon/delete_group.png" class="deleteIcon icon" title="delete"/>';
		var fieldMoveUpIcon = '<img src="icon/up.png" class="upIcon icon" title="move up"/>';
		var fieldMoveDownIcon = '<img src="icon/down.png" class="downIcon icon" title="move down"/>';

		var addElementIcon = '<img src="icon/add.png" class="addElementIcon icon" title="add field"/>';
		var addArrayElementIcon = '<img src="icon/add.png" class="addArrayElementIcon icon" title="add field"/>';

		var addArray2ArrayIcon = '<img src="icon/add_array.png" class="addArray2ArrayIcon icon" title="add array"/>';
		var addRecord2RecordIcon = '<img src="icon/add_record.png" class="addRecord2RecordIcon icon" title="add map"/>';

		var addArray2RecordIcon = '<img src="icon/add_array.png" class="addArray2RecordIcon icon" title="add array"/>';
		var addRecord2ArrayIcon = '<img src="icon/add_record.png" class="addRecord2ArrayIcon icon" title="add map"/>';
		var undoTooltip = 'undo delete, move, add ';
		var undoIcon = '<img src="icon/undo.png" class="undoIcon icon"/>';

		var textFieldName = '<input class="inputTextFieldName" type="text" value="*name*">';
		var textFieldValue = '<input class="inputTextFieldValue" type="text" value="*value*">';
		var fieldIcons = fieldDeleteIcon + fieldMoveUpIcon + fieldMoveDownIcon;
		var recordIcons = recordDeleteIcon + fieldMoveUpIcon
				+ fieldMoveDownIcon;
		
		function emptyNameAndValue(s) {
			return s.replace(/\*value\*/g, '').replace(/\*name\*/g, '');
		}

		var elementHtmlV = '<div class="field">' + textFieldName
				+ textFieldValue + fieldIcons + '</div>';
		var elementHtml = emptyNameAndValue(elementHtmlV);

		var arrayHtmlElementV = '<div class="field">' + textFieldValue
				+ fieldIcons + '</div>';
		var arrayHtmlElement = emptyNameAndValue(arrayHtmlElementV);

		var record2RecordHtmlV = '<div class="field record">'
				+ '<div class="node">' + collapseIcon + recordDecoratorIcon
				+ textFieldName + recordIcons + addElementIcon
				+ addRecord2RecordIcon + addArray2RecordIcon
				+ '<div class="fieldList"/>' + '</div>' + '</div>';
		var record2RecordHtml = emptyNameAndValue(record2RecordHtmlV);

		var array2ArrayHtmlV = '<div class="field array">'
				+ '<div class="node">' + collapseIcon + arrayDecoratorIcon
				+ recordIcons + addArrayElementIcon + addRecord2ArrayIcon
				+ addArray2ArrayIcon + '<div class="fieldList"/>' + '</div>'
				+ '</div>';
		var array2ArrayHtml = emptyNameAndValue(array2ArrayHtmlV);

		var record2ArrayHtmlV = '<div class="field record">'
				+ '<div class="node">' + collapseIcon + recordDecoratorIcon
				+ recordIcons + addElementIcon + addRecord2RecordIcon
				+ addArray2RecordIcon + '<div class="fieldList"/>' + '</div>'
				+ '</div>';
		var record2ArrayHtml = emptyNameAndValue(record2ArrayHtmlV);

		var array2RecordHtmlV = '<div class="field array">'
				+ '<div class="node">' + collapseIcon + arrayDecoratorIcon
				+ textFieldName + recordIcons + addArrayElementIcon
				+ addRecord2ArrayIcon + addArray2ArrayIcon
				+ '<div class="fieldList"/>' + '</div>' + '</div>';
		var array2RecordHtml = emptyNameAndValue(array2RecordHtmlV);

		var emptyForm = '<form*id*>' + '<div class="node">'
				+ '<span class="title">*title*</span><br/>' + toggleIconsIcon
				+ addElementIcon + addRecord2RecordIcon + addArray2RecordIcon
				+ undoIcon + '<br/>' + '<div class="fieldList"></div>'
				+ '</div>' + '<img src="icon/submit.png" class="submitIcon"/>'
				+ '</form>';

		// when true callbacks are not registered, styles are not set
		// this significantly speeds up undo when the whole form is displayed
		_this.speedUp = false;
		_this.iconsVisible = false;
		_this.undoBuffer = [];
		function setUndoTooltip() {
			_this.formNode.find(".undoIcon").attr('title',
					undoTooltip + '(' + _this.undoBuffer.length + ')');
		}
		function saveUndoState() {
			_this.undoBuffer.push(collectData());
			setUndoTooltip();
		}

		function addItem(element, text) {
			var fieldList = $(element).siblings(".fieldList");
			var t = $(element).siblings(".toggleIcon");
			fieldList.append(text);
			fieldList.show("slow", function() {
				$(t).attr('src', collapseIconFile);
				$(t).attr('title', 'collapse');
			});
			if (_this.iconsVisible) {
				var icons = fieldList.find(".icon");
				icons.show("slow");
			}
			_this.registerCallbacksAndStyles();
		}

		function deleteItem(element) {
			saveUndoState();
			var field = $($(element).parents(".field")[0]);
			field.hide('slow', function() {
				field.remove();
			});
			_this.registerCallbacksAndStyles();
		}

		_this.undoCallback = function(event) {
			var lastSavedState = _this.undoBuffer.pop();
			if (lastSavedState) {
				node.html(emptyForm);
				_this.speedUp = true;
				addRecord(node.find(".icon"), lastSavedState);
				_this.speedUp = false;
				_this.formNode = node.children('form');
				_this.registerCallbacksAndStyles();
			}
			setUndoTooltip();
		};

		_this.addElementCallback = function(event) {
			saveUndoState();
			addItem(this, elementHtml);
		};

		_this.addArrayElementCallback = function(event) {
			saveUndoState();
			addItem(this, arrayHtmlElement);
		};

		_this.addRecord2RecordCallback = function(event) {
			saveUndoState();
			addItem(this, record2RecordHtml);
		};

		_this.addArray2ArrayCallback = function(event) {
			saveUndoState();
			addItem(this, array2ArrayHtml);
		};

		_this.addRecord2ArrayCallback = function(event) {
			saveUndoState();
			addItem(this, record2ArrayHtml);
		};

		_this.addArray2RecordCallback = function(event) {
			saveUndoState();
			addItem(this, array2RecordHtml);
		};

		_this.deleteCallback = function(event) {
			deleteItem(this);
		};

		function swapTwoFields(field1, field2) {
			if (null == field1 || null == field2 || 0 == field1.length
					|| 0 == field2.length)
				return;
			saveUndoState();
			$(field1).hide('slow', function() {
				$(field1).detach();
				$(field2).after(field1);
				$(field1).show('slow');
			});
			_this.registerCallbacksAndStyles();
		}

		function moveItemUp(element) {
			var thisField = $(element).parents(".field")[0];
			var prevField = $(thisField).prev();
			swapTwoFields(prevField, thisField);
		}

		function moveItemDown(element) {
			var thisField = $(element).parents(".field")[0];
			var nextField = $(thisField).next();
			swapTwoFields(thisField, nextField);
		}
		_this.moveUpCallback = function(event) {
			moveItemUp(this);
		};

		_this.moveDownCallback = function(event) {
			moveItemDown(this);
		};

		_this.callerCallbackFunction = null;
		_this.submitCallback = function(event) {
			if (_this.callerCallbackFunction != null) {
				_this.callerCallbackFunction(collectData());
			}
		};

		_this.toggleRecordCallback = function(event) {
			var fieldList = $(this).siblings(".fieldList");
			var visibleFields = fieldList.filter(":visible");
			if (null == visibleFields || 0 == visibleFields.length) {
				var t = this;
				fieldList.show("slow", function() {
					$(t).attr('src', collapseIconFile);
					$(t).attr('title', 'collapse');
				});
			} else {
				var t = this;
				fieldList.hide("slow", function() {
					$(t).attr('src', expandIconFile);
					$(t).attr('title', 'expand');
				});
			}
			if (!_this.iconsVisible) {
				fieldList.children(".field").children(".icon").hide();
			}
		};

		_this.toggleIconsCalback = function(event) {
			if (_this.iconsVisible) {
				$(_this.formNode).find(".icon").hide("slow");
			} else {
				$(_this.formNode).find(".icon").show("slow");
			}
			_this.iconsVisible = !_this.iconsVisible;
		};

		_this.formNode = null;

		_this.registerCallbacksAndStyles = function() {
			if (_this.speedUp)
				return;
			// register callback for somebody clicking on an add element icon
			$(_this.formNode).find(".addElementIcon").off("click").on("click",
					_this.addElementCallback);
			// register callback for somebody clicking on an add array icon
			$(_this.formNode).find(".addArrayElementIcon").off("click").on(
					"click", _this.addArrayElementCallback);

			// register callback for somebody clicking on an add map icon
			$(_this.formNode).find(".addRecord2RecordIcon").off("click").on(
					"click", _this.addRecord2RecordCallback);
			// register callback for somebody clicking on add array icon
			$(_this.formNode).find(".addArray2ArrayIcon").off("click").on(
					"click", _this.addArray2ArrayCallback);
			// register callback for somebody clicking on an add map icon
			$(_this.formNode).find(".addRecord2ArrayIcon").off("click").on(
					"click", _this.addRecord2ArrayCallback);
			// register callback for somebody clicking on add array icon
			$(_this.formNode).find(".addArray2RecordIcon").off("click").on(
					"click", _this.addArray2RecordCallback);
			$(_this.formNode).find(".toggleIconsIcon").off("click").on("click",
					_this.toggleIconsCalback);
			// register callback for somebody clicking on a delete icon
			$(_this.formNode).find(".deleteIcon").off("click").on("click",
					_this.deleteCallback);
			// register callback for somebody clicking on the up icon
			$(_this.formNode).find(".upIcon").off("click").on("click",
					_this.moveUpCallback);
			// register callback for somebody clicking on the down icon
			$(_this.formNode).find(".downIcon").off("click").on("click",
					_this.moveDownCallback);
			// register callback for somebody clicking on the submit icon
			$(_this.formNode).find(".submitIcon").off("click").on("click",
					_this.submitCallback);
			$(_this.formNode).find(".undoIcon").off("click").on("click",
					_this.undoCallback);
			// register callback for somebody clicking on the show/hide icon of
			// an
			// array or record
			$(_this.formNode).find(".toggleIcon").off("click").on("click",
					_this.toggleRecordCallback);
		};

		function collectFields(fieldList) {
			var fields = $(fieldList).children(".field");
			var parentField = $(fieldList).parents(".field");
			if (null != parentField)
				parentField = parentField[0];
			var isArray = null != parentField
					&& $(parentField).hasClass("array");
			if (null == fields || 0 == fields.length)
				return isArray ? [] : {};
			var myObject;
			if (isArray) {
				myObject = [];
			} else {
				myObject = {};
			}
			fields.each(function(index, field) {
				var name = $(field).children(".inputTextFieldName").attr(
						"value");
				var value = $(field).children(".inputTextFieldValue");
				if (null != value && 0 != value.length) {
					if (isArray) {
						myObject.push(value.attr("value"));
					} else {
						myObject[name] = value.attr("value");
					}
				} else {
					name = $(field).children(".node").children(
							".inputTextFieldName").attr("value");
					var subFieldList = $(field).children(".node").children(
							".fieldList")[0];
					if (isArray) {
						myObject.push(collectFields(subFieldList));
					} else {
						myObject[name] = collectFields(subFieldList);
					}
				}
			});
			return myObject;
		}

		function collectData() {
			if (null == _this.formNode)
				return null;
			var fieldList = $(_this.formNode).children(".node").children(
					".fieldList");
			return collectFields(fieldList);
		}

		function addArray(element, data) {
			for ( var key in data) {
				if (typeof (data[key]) != "object") {
					var arrayHtmlElement = arrayHtmlElementV.replace(
							/\*value\*/g, "" + data[key]);
					addItem(element, arrayHtmlElement);
				} else {
					if (data[key] instanceof Array) {
						var array2ArrayHtml = array2ArrayHtmlV;
						addItem(element, array2ArrayHtml);
						addArray($(element).parent().children(".fieldList")
								.children(".field").last().children(".node")
								.children(".icon"), data[key]);
					} else {
						var record2ArrayHtml = record2ArrayHtmlV;
						addItem(element, record2ArrayHtml);
						addRecord($(element).parent().children(".fieldList")
								.children(".field").last().children(".node")
								.children(".icon"), data[key]);
					}
				}
			}
		}

		function addRecord(element, data) {
			for ( var key in data) {
				if (typeof (data[key]) != "object") {
					var elementHtml = elementHtmlV.replace(/\*value\*/g,
							"" + data[key]).replace(/\*name\*/g, "" + key);
					addItem(element, elementHtml);
				} else {
					if (data[key] instanceof Array) {
						var array2RecordHtml = array2RecordHtmlV.replace(
								/\*name\*/, "" + key);
						addItem(element, array2RecordHtml);
						addArray($(element).siblings(".fieldList").children(
								".field").last().children(".node").children(
								".icon"), data[key]);
					} else {
						var record2RecordHtml = record2RecordHtmlV.replace(
								/\*name\*/, "" + key);
						addItem(element, record2RecordHtml);
						addRecord($(element).siblings(".fieldList").children(
								".field").last().children(".node").children(
								".icon"), data[key]);
					}
				}
			}
		}

		// manage options that should be handled before or during the structure
		// is created
		if (typeof (args) == "object") {
			_this.callerCallbackFunction = args.callback;
			emptyForm = emptyForm.replace(/\*title\*/g, args.title || '')
					.replace(/\*id\*/g, args.id ? ' id="' + args.id + '"' : '');
			node.html(emptyForm);
			if (null != args.data && 0 != args.data.length) {
				_this.speedUp = true;
				addRecord(node.find(".icon"), args.data);
				_this.speedUp = false;
			}
		} else {
			emptyForm = emptyForm.replace(/\*title\*/g, '').replace(/\*id\*/g,
					'');
			node.html(emptyForm);
		}
		_this.formNode = node.children('form');

		// manage options that need the created structure
		if (typeof (args) == "object") {
			if (!args.css && $("#jsonedit-default-style").length === 0) {
				$("head").append(defaultStyles);
			}
			_this.formNode.find(".icon").css({
				display : "none"
			});
			// none at the moment
		}
		_this.registerCallbacksAndStyles();
		setUndoTooltip();
	}
})(jQuery);
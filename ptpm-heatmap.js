ptpmgeo = function() {
	var heatmapConfig = {
		container: "",
		maxOpacity: .5,
		minOpacity: 0,
		blur: .75
	};
	var heatmapDataSettings = {
		dataValue: 12,
		radius: 10
	};
	var heatmapData = [];
	var heatmapInstance;
	var mapImage;
	var logText = "";
	var teamSelector = $("#teamSelector");
	var mapSelector = $("#mapSelector");

	var init = function() {
		heatmapConfig.container = document.getElementById("heatmapContainer");

		$('.slider, .number').each(function() {
			var slider = $(this);
			var id = slider.attr('id');
			var input = $("#" + id + "Input");
			var output = $("#" + id + "Output");

			if (slider.data("config") !== undefined)
				input.get(0).value = heatmapConfig[id];
			else
				input.get(0).value = heatmapDataSettings[id];

			if (output)
				output.text(input.get(0).value);

			input.on('input', function(e) {
				var value = $(e.target).val();
				$("#" + id + "Output").text(value);

				if (slider.data("config") !== undefined)
					heatmapConfig[id] = value;
				else
					heatmapDataSettings[id] = value;
			});
		});

		$("#repaint").click(repaint);

		readTextFile("geo.log", logOpened);

		$("#download").click(function() {
	    	downloadCanvas(this, "heatmapCanvas", "ptpm-heatmap.png");
		});
	}

	function repaint() {
		$("#controls").addClass("processing");

		// allow time for the css to repaint
		window.setTimeout(function() {
			heatmapInstance.configure(heatmapConfig);

			setHeatmapData(logText);

			heatmapInstance.setData({
				max: 100,
				min: 0,
				data: heatmapData
			});

			setBackgroundImage();

			$("#controls").removeClass("processing");
        }, 50);		
	}

	function logOpened(text) {
		logText = text;

		// create heatmap with configuration
		heatmapInstance = h337.create(heatmapConfig);
		var canvas = $("#heatmapContainer canvas");
		canvas.attr("id", "heatmapCanvas");
	
		setHeatmapData(text);

		loadBackgroundImage();		
	}

	function setHeatmapData(text) {
		heatmapData = [];
		var team = teamSelector.get(0).value;
		var maps = mapSelector.get(0).selectedOptions;
		var lines = text.split("\n");

		var delimiter = ","

		if (text.includes("¶")) {
			// paragraph delimiter
			delimiter = "¶"
		}

		for(var i = 0; i < lines.length; i++) {
			var parts = lines[i].split(delimiter)

			// first version columns
			var time = parts[0];
			var playerID = parts[1];
			var skin = parseInt(parts[2]);
			var x = parseFloat(parts[3]);
			var y = parseFloat(parts[4]) * -1
			var z = parseFloat(parts[5]);
			var interior = parseInt(parts[6]);
			var mapName = parts[7];

			var roundID = "";
			var time = "";

			// newer version columns
			if (delimiter == "¶") {
				roundID = parts[0];
				time = parts[1];
				playerID = parts[2];
				skin = parseInt(parts[3]);
				x = parseFloat(parts[4]);
				y = parseFloat(parts[5]) * -1
				z = parseFloat(parts[6]);
				interior = parseInt(parts[7]);
				mapName = parts[8];			
			}

			if (skin == 0)
				continue;
			
			if (mapName == "None")
				continue;

			if (skinToTeam(skin) == team && interior == 0 && mapMatches(maps, mapNameToID(mapName))) {
				heatmapData.push({
					x: ((x + 3000) / 6000) * 1200, 
					y: ((y + 3000) / 6000) * 1200, 
					value: heatmapDataSettings.dataValue,
					radius: heatmapDataSettings.radius
				})
			}
		}

		heatmapInstance.setData({
			max: 100,
			min: 0,
			data: heatmapData
		});
	}

	// inject the map background image into the canvas (so we can download it)
	function loadBackgroundImage() {
		mapImage = new Image()

		mapImage.onload = setBackgroundImage;
		mapImage.src = "gtasa-map-small.png";
	}

	function setBackgroundImage() {
		var canvas = document.getElementById("heatmapCanvas");
		var context = canvas.getContext("2d")
		context.globalCompositeOperation = "destination-over";
		context.drawImage(mapImage, 0, 0);
		context.globalCompositeOperation = "source-over";
	}

	var skinToTeam = function(skin) {
		if (skin == 147) 
			return "pm";
		else if (skin == 230 || skin == 212 || skin == 200 || skin == 137)
			return "psychopath";
		else if (skin == 181 || skin == 183 || skin == 179 || skin == 191 || skin == 111 || skin == 73 || skin == 100 || skin == 274)
			return "terrorist";
		else if (skin == 163 || skin == 164 || skin == 165 || skin == 166 || skin == 141 || skin == 276)
			return "bodyguard";
		else if (skin == 280 || skin == 281 || skin == 282 || skin == 283 || skin == 284 || skin == 285 || skin == 286 || skin == 288 || skin == 246 || skin == 275)
			return "cop";

		return "unknown";
	}

	var mapNameToID = function(mapName) {
		mapName = mapName.toLowerCase();

		if (mapName == "area 51")
			return "a51";
		else if (mapName == "air assault")
			return "airassault";
		else if (mapName == "bayside")
			return "bayside";
		else if (mapName == "mt. chiliad")
			return "chiliad";
		else if (mapName == "countryside")
			return "countryside";
		else if (mapName == "desert")
			return "desert";
		else if (mapName == "factory")
			return "factory";
		else if (mapName == "los santos")
			return "ls";
		else if (mapName == "los santos w/ hydra" || mapName == "los santos with hydra")
			return "lshydra";
		else if (mapName == "las venturas")
			return "lv";
		else if (mapName == "las venturas w/ objectives" || mapName == "las venturas with objectives")
			return "lvobj";
		else if (mapName == "san fierro")
			return "sf";

		return "none";
	}

	var mapMatches = function(maps, mapID) {	
		for(var i = 0; i < maps.length; i++) {
			if (maps[i].value == "all" || maps[i].value == mapID) {
				return true
			}
		}

		return false
	}

	return {
		init: init
	}
}();


$(function() {
	ptpmgeo.init();
})


// from https://stackoverflow.com/questions/14446447/javascript-read-local-text-file
function readTextFile(file, fn) {
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, false);

    rawFile.onreadystatechange = function () {
        if(rawFile.readyState === 4) {
            if(rawFile.status === 200 || rawFile.status == 0) {
                fn(rawFile.responseText);
            }
        }
    }
    rawFile.send(null);
}

function downloadCanvas(link, canvasId, filename) {
	var imgData = document.getElementById(canvasId).toDataURL();
	var blob = dataURLtoBlob(imgData);
	var objurl = URL.createObjectURL(blob);

    link.href = objurl;
    link.download = filename;
}

// work around a href length issue
// from https://stackoverflow.com/questions/37135417/download-canvas-as-png-in-fabric-js-giving-network-error
function dataURLtoBlob(dataurl) {
    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
}
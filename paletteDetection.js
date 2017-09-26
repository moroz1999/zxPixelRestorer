window.PaletteDetectionComponent = function()
{
	var width = 1;
	var height = 1;
	var sourceResource;
	var resultResource;
	var palette;
	var palette2;
	var zxImage;
	var pairColors = {
		'0000':'1000',
		'0001':'1001',
		'0010':'1010',
		'0011':'1011',
		'0100':'1100',
		'0101':'1101',
		'0110':'1110',
		'0111':'1111',

		'1000':'0000',
		'1001':'0001',
		'1010':'0010',
		'1011':'0011',
		'1100':'0100',
		'1101':'0101',
		'1110':'0110',
		'1111':'0111'
	};

	var init = function()
	{
		palette = {
			'0000':0x000000,
			'0001':0x3d1476,
			'0010':0xdc1f22,
			'0011':0xe12d72,
			'0100':0x00a05e,
			'0101':0x00a8e4,
			'0110':0xf8ee4c,
			'0111':0xfefffe,

			'1000':0x000000,
			'1001':0x3d1476,
			'1010':0xdc1f22,
			'1011':0xe12d72,
			'1100':0x00a05e,
			'1101':0x00a8e4,
			'1110':0xf8ee4c,
			'1111':0xfefffe
		};
		palette2 = {
			'0000':0x000000,
			'0001':0x0000CD,
			'0010':0xCD0000,
			'0011':0xCD00CD,
			'0100':0x00CD00,
			'0101':0x00CDCD,
			'0110':0xCDCD00,
			'0111':0xCDCDCD,

			'1000':0x000000,
			'1001':0x0000FF,
			'1010':0xFF0000,
			'1011':0xFF00FF,
			'1100':0x00FF00,
			'1101':0x00FFFF,
			'1110':0xFFFF00,
			'1111':0xFFFFFF
		};
	};
	this.convert = function(res1, res2)
	{
		sourceResource = res1;
		resultResource = res2;
		width = Math.ceil(sourceResource.width / 8);
		height = Math.ceil(sourceResource.width / 8);

		for (var i in palette)
		{
			palette[i] = splitRgb(palette[i]);
		}
		for (var i in palette2)
		{
			palette2[i] = splitRgb(palette2[i]);
		}

		zxImage = new ZxImage();

		for (var y = 0; y < height; y++)
		{
			for (var x = 0; x < width; x++)
			{
				getAttrInfo(x, y);
			}
		}
		var data = zxImage.exportData();

		return [data, resultResource];

	};
	this.setPalette = function(newPalette)
	{
		palette = newPalette;
	};

	var getAttrInfo = function(attrx, attry)
			{
				var colors = new Array();
				for (var y = attry * 8; y < attry * 8 + 8; y++)
				{
					for (var x = attrx * 8; x < attrx * 8 + 8; x++)
					{
						var color = imagecolorat(sourceResource, x, y);
						colors.push({
							'color':color,
							'x':x,
							'y':y
						});
					}
				}

				var usedColorsIndex = {};
				for (var i in colors)
				{
					var info = colors[i];
					var closest = {
						'diff':null,
						'color':null,
						'code':null
					};

					for (var code in palette)
					{
						color = palette[code];
						var diff = colorDiff(info['color'], color);
						if (closest['diff'] == null || closest['diff'] > diff)
						{
							closest['diff'] = diff;
							closest['color'] = color;
							closest['code'] = code;
						}
					}
					if (typeof usedColorsIndex[closest['code']] == 'undefined')
					{
						usedColorsIndex[closest['code']] = 0;
					}
					usedColorsIndex[closest['code']]++;
				}

				var usedColors = [];
				for (code in usedColorsIndex)
				{
					usedColors.push({'code':code, 'count':usedColorsIndex[code]});
				}

				usedColors.sort(function(a, b)
				{
					return b.count - a.count;
				});

				var maxColor = usedColors.shift().code;
				if (usedColors.length > 0)
				{
					var minColor = usedColors.shift().code;
					if (pairColors[maxColor] == minColor)
					{
						if (usedColors.length > 0)
						{
							minColor = usedColors.shift().code;
						}
						else
						{
							minColor = maxColor;
						}
					}
				}
				else
				{
					minColor = maxColor;
				}

				for (i in colors)
				{
					info = colors[i];
					if (colorDiff(info['color'], palette[maxColor]) < colorDiff(info['color'], palette[minColor]))
					{
						zxImage.setPixel(info['x'], info['y'], maxColor);
						imagesetpixel(resultResource, info['x'], info['y'], palette2[maxColor]);
					}
					else
					{
						zxImage.resetPixel(info['x'], info['y'], minColor);
						imagesetpixel(resultResource, info['x'], info['y'], palette2[minColor]);
					}
				}

			}
			;

	var imagecolorat = function(imageData, x, y)
	{
		var canvasCoordinate = (y * imageData.width + x) * 4;
		return [
			imageData.data[canvasCoordinate], imageData.data[canvasCoordinate + 1],
			imageData.data[canvasCoordinate + 2]
		];
	};
	var imagesetpixel = function(imageData, x, y, color)
	{
		var canvasCoordinate = (y * imageData.width + x) * 4;

		imageData.data[canvasCoordinate] = color[0];
		imageData.data[canvasCoordinate + 1] = color[1];
		imageData.data[canvasCoordinate + 2] = color[2];
		imageData.data[canvasCoordinate + 3] = 255;

	};

	var colorDiff = function(rgb, rgb2)
	{
		return simpdiff5(rgb[0], rgb[1], rgb[2], rgb2[0], rgb2[1], rgb2[2]);
	};

	var simpdiff5 = function(R1, G1, B1, R2, G2, B2)
	{
		var rmean = (R1 + R2) / 2;
		var r = R1 - R2;
		var g = G1 - G2;
		var b = B1 - B2;

		var weightR = 2 + rmean / 256;
		var weightG = 4.0;
		var weightB = 2 + (255 - rmean) / 256;
		return Math.sqrt(weightR * r * r + weightG * g * g + weightB * b * b);

	};

	var splitRgb = function(rgb)
	{
		var r = (rgb >> 16) & 0xFF;
		var g = (rgb >> 8) & 0xFF;
		var b = rgb & 0xFF;

		return [r, g, b];
	};

	init();
};
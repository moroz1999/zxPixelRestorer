window.ZxImage = function()
{
	var pixels = {};
	var attributes = new Array();
	var w = 256;
	var h = 192;
	var aw = w / 8;
	var ah = h / 8;

	var init = function()
	{
		for (var y = 0; y < h; y++)
		{
			pixels[y] = {};
			for (var x = 0; x < w; x++)
			{
				pixels[y][x] = 0;
			}
		}
		for (var y = 0; y < ah; y++)
		{
			attributes[y] = {};
			for (var x = 0; x < aw; x++)
			{
				attributes[y][x] = ['0', '000','111'];
			}
		}
	};
	this.setPixel = function(x, y, colorCode)
	{
		if (x < w && y < h)
		{
			this.setInkColor(x, y, colorCode);
			pixels[y][x] = 1;
		}
	};
	this.resetPixel = function(x, y, colorCode)
	{
		if (x < w && y < h)
		{
			this.setPaperColor(x, y, colorCode);
			pixels[y][x] = 0;
		}
	};
	this.setInkColor = function(x, y, colorCode)
	{
		attributes[Math.floor(y/8)][Math.floor(x/8)][0] = colorCode.substr(0,1);
		attributes[Math.floor(y/8)][Math.floor(x/8)][2] = colorCode.substr(1,3);
	};
	this.setPaperColor = function(x, y, colorCode)
	{
		attributes[Math.floor(y/8)][Math.floor(x/8)][0] = colorCode.substr(0,1);
		attributes[Math.floor(y/8)][Math.floor(x/8)][1] = colorCode.substr(1,3);
	};
	this.exportData = function()
	{
		var bytes = new Uint8Array(6912);
		var byteNumber = 0;
		
		var byteText = '';
		var y = 0;
		for (var yn = 0; yn < h; yn++)
		{
			var length = 0;
			for (var x = 0; x < w; x++)
			{
				byteText += pixels[y][x];
				length++;
				if (length == 8)
				{					
					bytes[byteNumber] = parseInt(byteText, 2);			
					byteText = '';
					byteNumber++;
					length = 0;
				}
			}
			y = downRow(y);
		}
		
		var byteText = '';
		for (var y = 0; y < ah; y++)
		{			
			for (var x = 0; x < aw; x++)
			{				
				bytes[byteNumber] = parseInt(attributes[y][x][0]+attributes[y][x][1]+attributes[y][x][2], 2);			
				byteNumber++;			
			}
		}
		return btoa(uint8ToString(bytes));
	}
	function uint8ToString(buf) 
	{
		var i, length, out = '';
		for (i = 0, length = buf.length; i < length; i += 1) 
		{
			out += String.fromCharCode(buf[i]);
		}
		return out;
	}
	function downRow(y)
	{
		var add = y - y%64;
		y = y - add;
		
		if (y == 63)
		{
			y = 64;
		}
		else
		{
			y = y+8;
			if (y >= 64)
			{
				y = y%64+1;
			}
		}
		
		y = y+ add;
		
		
		return y;
	}

	init();
};
Raphael.fn.g.floatingBarChart = function (x, y, width, height, values, options) {
    //plugin for g.Raphael uses to create "floating" bar charts. Also provides background grid and axis.
    //options: 
    //          x, y: offset in pixels relative to the current paper instance
    //          width, height: size of the chart. must be expressed as integer value, represents value in pixels.
    //          values: array of bar items. an array item contains an object as: {startPoint: integer, tallness: integer, gradientString: string of gradient}
    //          options: object containing options. Most notably:
    //                  options.backgroundGradient: string representing the gradient to use
    //                  options.gridHeight: integer representing the distance in pixels between two lines or two entries on the axis. Chart height MUST be divisible by this number.
    //                  options.axisWidth: integer representing the width in pixels of the axis
    //                  options.axisFontSize: integer representing the axis font size in pixels
    //                  options.chartFontSize: integer representing the font size used under the charts in pixels
    //                  options.chartFontMargin: integer representing margin of the font relative to the bottom of a bar and to the bottom of itself [basically margin-top, margin-bottom]
    //                  options.barsSideMargin: integer representing margin in pixels of the LEFT and RIGHT sides of the bar GROUP. think of all bars contained in a div, and apply a margin to that.
    //                  options.barWidth: integer representing the width of a bar in pixels

    //really make sure that all methods declared from now on are locally scoped.
    var floatingBarChart = {};
    
    //Note: constructor methods are down on the bottom.
    
    floatingBarChart.drawBackground = function(){
        //main routine to draw the background and the row separators (lines)
        background.push(
            paper.rect(chartPosition.x, chartPosition.y, chartWidth, height).attr({
                "fill": options.backgroundGradient,
                "stroke-width": 1,
                "stroke": "#ccc"
            })
        );

        for (var i = chartRowAmount - 1; i >= 1; i--){
            var topOffset = i * options.gridHeight + chartPosition.y;
            background.push(
                //Draw a row line in the chart. Note that we are offsetting the Y position by 0.5px so to be able to properly draw a line of 1px stroke width.
                paper.path("M" + chartPosition.x + " " + (topOffset + 0.5) + "L" + (chartPosition.x + chartWidth) + " " + (topOffset + 0.5)).attr({
                    "stroke-width": 1, 
                    "stroke": "#ccc"
                })
            );
        };
    };

    floatingBarChart.drawAxis = function(){
        //main routine to draw the axis next to the chart.
        
        //we have X rows, but we have X + 1 lines to label.
        var labelCount = chartRowAmount + 1;
        var labelVirtualOffset;
        var labelDrawingOffset = {};
        var labelValue;
        var i;
        //cycle all the labels and compute the properties to be drawn
        for (i=0; i < labelCount; i++) {
            labelVirtualOffset = i * options.gridHeight;
            labelDrawingOffset = {x: x, y: labelVirtualOffset + y};
            labelValue = maxVal - Math.round(labelVirtualOffset / unitsInPixel);

            axis.push(
                //actually draw the element to the paper
                paper.text(labelDrawingOffset.x, labelDrawingOffset.y, labelValue + "%").attr({
                    "font-family": options.fontFace,
                    "font-size": options.axisFontSize,
                    "height": options.fontLineHeight
                })
            );
        };
    };

    floatingBarChart.drawBars = function(){
        //main routine for drawing the bars
        var barProperties = {};
        var labelOffset = {};
        var barMargin = floatingBarChart.computeSingleBarMargin();
        for (var i=0; i < values.length; i++) {
            //compute the bar's properties
            barProperties = {
                x: options.barsSideMargin + chartPosition.x + ((options.barWidth + barMargin) * (i)),
                y: Math.round(((Math.abs(maxVal - (values[i].startPoint + values[i].tallness))) *  unitsInPixel)) + y,
                w: options.barWidth,
                h: values[i].tallness * unitsInPixel
            };

            //draw the shadow, with a 2x2 px offset
            bars.push(
                paper.rect(barProperties.x, barProperties.y, barProperties.w, barProperties.h).attr({
                    "fill": "#555",
                    "stroke": "none",
                    "translation": "2,2",
                    "opacity": 0.4
                })
            );
            //draw the actual bar
            bars.push(
                paper.rect(barProperties.x, barProperties.y, barProperties.w, barProperties.h).attr({
                    "fill": values[i].gradientString,
                    "stroke": 0
                })
            );

            bars.push(
                paper.text((barProperties.x + (options.barWidth / 2)) , barProperties.y + barProperties.h + options.chartFontMargin , values[i].name).attr({
                  "font-family": options.fontFace,
                  "font-size": options.fontSize,
                  "height": options.fontLineHeight  
                })
            );
        };
    };

    floatingBarChart.computeSingleBarMargin = function(){
        var spaceRemaining;
        var margin;

        spaceRemaining = chartWidth - (options.barsSideMargin * 2) - (options.barWidth * values.length);
        margin = Math.round(spaceRemaining / (values.length - 1));
        return margin;
    };

    floatingBarChart.getMinValue = function(){
        //compute the lowest value we've got in our list of values
        var currentMinVal = values[values.length - 1].startPoint;
        for (var i=0; i < values.length; i++) {
            if(currentMinVal > values[i].startPoint){
                //assign new smallest value
                currentMinVal = values[i].startPoint;
            }

        };
        return currentMinVal;
    };

    floatingBarChart.getMaxValue = function(){
        //compute the highest value we've got in our list of values
        var currentMaxVal = values[values.length - 1].startPoint + values[values.length - 1].tallness;
        for (var i=0; i < values.length; i++) {
            if(currentMaxVal < (values[i].startPoint + values[i].tallness)){
                //assign new largest value
                currentMaxVal = values[i].startPoint + values[i].tallness;
            }
        };
        return currentMaxVal;
    };
    
    floatingBarChart.getDeltaFromMinValue = function(value){
        //compute the distance in units from the lowest value. 
        return Math.abs(minVal - value);
    };
    
    //constructor methods
    
    //we are scoped within a current instance of paper. create a copy to not collide when within function scopes.
    var paper = this;

    //compute minimum and maximum value
    var minVal = floatingBarChart.getMinValue();
    var maxVal = floatingBarChart.getMaxValue();

    //compute the interval [delta] of values to be shown
    var chartValueDelta = maxVal - minVal;

    //compute how many pixels correspond to a "unit"
    var unitsInPixel = height / chartValueDelta;

    
    //compensate for margins...
    var minValSubtractor = (options.chartFontSize / unitsInPixel) + ((options.chartFontMargin * 2) / unitsInPixel);
    minVal = Math.floor(minVal - minValSubtractor);
    var maxValAdditioner = ((options.chartFontMargin * 2) / unitsInPixel);
    maxVal = Math.ceil(maxVal + maxValAdditioner);
    chartValueDelta = maxVal - minVal;
    unitsInPixel = height / chartValueDelta;

    //compute size of the axis and chart area
    var axisWidth = options.axisWidth;
    var chartWidth = width - options.axisWidth;

    //define where the chart is starting at, compensating with the offset specified in the instantiation params {x, y}
    var chartPosition = {x: options.axisWidth + x, y: y};

    //compute how many rows we have
    var chartRowAmount = Math.floor(height / options.gridHeight);

    //create our sets
    var background = this.set();
    var axis = this.set();
    var bars = this.set();

    //start drawing stuff
    floatingBarChart.drawBackground();
    floatingBarChart.drawAxis();
    floatingBarChart.drawBars();

};
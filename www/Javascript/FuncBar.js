!function(){
  var fB = {};

  var x = d3.scale.ordinal();
  var y = d3.scale.linear()

  var xAxis = d3.svg.axis()
  .orient("bottom");

  var yAxis = d3.svg.axis()
  .orient("left")
  .tickFormat(d3.format(".2s"));


  fB.vizData = function(data, sample_order){

    var y0 = 0;
    var y1 = 0;
    var total = 0;

    data.forEach(function(d) {
      var length = d.data.length;
      var y0 = 0;
      var y1 = 0;
      var h = d.length-1;

      //assign values for size of bars
      d.data.forEach(function(e){
        e.y0 = y0*100;
        e.y1= (y0 += +e.contributions)*100; 



      })

      total = d.data[length-1].y1;

      d.data.forEach(function(e){
        e.total = total;

        e.y0 = Math.round(e.y0/e.total*100*100)/100;
        e.y1 = Math.round(e.y1/e.total*100*100)/100;


      })


      
    });

    // var h = [];
    // data.map(function(d) { 
    //   d.data.map(function(e){
    //     h.push(e.Sample);
    //     return e.Sample;
    //   })  
    // });
    x.domain(sample_order);
    y.domain([0, 100]);
    return data;
  }


  fB.getSampleGroup = function(samp, sampledata, grouping){
    group = sampledata.filter(function(e){ return e.Sample==samp;})[0][grouping];
    return group;
  }



  // var sampleColor = d3.scale.ordinal();
  // sampleColor["1"] = "red";
  // sampleColor["2"] = "darkred";
  // sampleColor["3"] = "steelblue";
  // sampleColor["4"] = "darkblue";



  fB.Draw = function(stackdata, sampledata, colors, svglink, dims, highlight_overall, dehighlight_overall, sampleColor, sample_order, grouping){

	var graphdims = {width: dims.width - 45, height: dims.height * 8/10, height_buffer:10, width_buffer:0, sample_buffer:-dims.width / 100, sample_label_buffer:-2000/dims.width}
   x.rangeRoundBands([0, graphdims.width], .2);
   y.rangeRound([graphdims.height, 0]);
   xAxis.scale(x);
   yAxis.scale(y);

   var viz = fB.vizData(stackdata, sample_order);
   //console.log(viz)

  //y axis label
  svglink.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "middle")
    .attr("y", 0)
    .attr("x", -(graphdims.height + graphdims.height_buffer) / 2)
    .attr("font-size",18)
    .attr("dy", ".75em")
    .attr("transform", "rotate(-90)")
    .text("Relative Abundance (%)");

  //x-axis label
    svglink.append("text")
    .attr("class", "x label")
    .attr("text-anchor", "middle")
    .attr("y", dims.height-18)
    .attr("x", dims.width - graphdims.width + graphdims.width_buffer + ((graphdims.width - graphdims.width_buffer) / 2))
    .attr("font-size",18)
    .attr("dy", ".75em")
    .text("Samples");

    //init the tooltip as invisible
  var tooltip = d3.select("body")
  .append("div")
  .style("position", "absolute")
  .style("z-index", "10")
  .style("visibility", "hidden")
  .style("background", "lightyellow")
  .style("opacity", "1")
  .style("border", "0px")    
  .style("border-radius", "4px")  
  .style("padding","2px")

  .text("a simple tooltip");

    //create a Sample object for each sample
  var Sample = svglink.selectAll(".Sample")
  .data(viz.filter(function(d){ return d.Sample != average_contrib_sample_name}))
  .enter().append("g")
  .attr("class", "g")
  .attr("id", function(d){ return "func_"+d.Sample })
  .attr("transform", function(d) { return "translate(" + (dims.width-graphdims.width  + graphdims.width_buffer + graphdims.sample_buffer + x(d.Sample)) + "," + graphdims.height_buffer + ")"; });

    //create rects for each value, transpose based on sample

  Sample.selectAll("rect")
  .data(function(d) { 
   return d.data;
 })
  .enter().append("rect")
  .attr("func", function(d) {return d.func})
  .attr("taxon", function(d) { return d.Taxa})
  .attr("width", x.rangeBand())
  .attr("y", function(d) {return y(d.y1); })
  .attr("height", function(d) {return y(d.y0) - y(d.y1) + 1;} )
  .style("fill", function(d) { return colors(d.func); })
  //.style("opacity", 0.75)
  .on("mouseover", function(d){
    current_rectangle_data = d3.select(this).datum();
	selected = d3.select("#func_" + current_rectangle_data.Sample)
		.selectAll("rect").data()
		.filter(function(e){ 
			return e.func == current_rectangle_data.func; })
     total_abund = d3.sum(selected.map(function(e){ return e.contributions; }))
    highlight_overall("", current_rectangle_data.func, 2);
    	name_split = (current_rectangle_data.func.split('_')).pop()
    	//taxa_split = (current_rectangle_data.Taxa.split('_')).pop() //+ "<strong>Taxon: </strong>" + taxa_split 
        tooltip.html("<strong>Function: </strong>" + name_split + "<br>" +  "<strong>Sample: </strong>"+current_rectangle_data.Sample + " <br>"+"<strong>Relative Abundance: </strong>" + Math.round(total_abund*100*100)/100+ "%");
          return tooltip.style("visibility", "visible");
        })
  .on("mousemove", function(){return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");})
  .on("mouseout", function(){
    current_rectangle_data = d3.select(this).datum();
    dehighlight_overall("", current_rectangle_data.func, 2);
    return tooltip.style("visibility", "hidden");
  });

      //get the x axis set

  var xtick_svg = svglink.append("svg")
    .attr("id", "xtick_svg")
    .attr("x", 0)
    .attr("y",graphdims.height + graphdims.height_buffer)
    .attr("width", dims.width)
    .attr("height", dims.height-25 - graphdims.height - graphdims.height_buffer)
    .style("font-family", "Verdana");

  xtick_svg.append("g")
  .attr("class", "x axis")
  .attr("transform", "translate(" + (dims.width-graphdims.width + graphdims.width_buffer) + ",0)")
  .call(xAxis)
  .selectAll("text")
  .style("text-anchor", "end")
  .attr("dx", -8)
  .attr("dy", graphdims.sample_label_buffer)
  .attr("transform", function(d) {
    return "rotate(-90)"
  });

    //init y-axis
  svglink.append("g")
  .attr("class", "y axis")
  .attr("transform","translate(" + (dims.width-graphdims.width + graphdims.width_buffer) +"," +graphdims.height_buffer + ")")
  .call(yAxis)
  .append("text")
  .attr("transform", "rotate(-90)")
  .attr("y", 6)
  .attr("dy", ".71em")
  .style("text-anchor", "end")
  .attr("class", "y_label");

    svglink.selectAll("text").style("fill",function(m){
    if(sampledata.map(function(e){ return e.Sample; }).indexOf(m)!==-1){
      return sampleColor(fB.getSampleGroup(m, sampledata, grouping));        
    }
  });
}

fB.select_bars = function(func, colors){
  selected = d3.select("#func_bars")
    .selectAll(".g")
    .selectAll("rect")
    .filter(function(d) {
      return d.func == func;
    });
  current_color = selected.style("fill");
  var trimstr = func.replace(/\W+/g,'') + "_tx";
  if (d3.select("#" + trimstr)[0][0] == null) {
     var t = textures.lines()
       .thicker()
       .background(colors(func).brighter(0.4))
       .id(trimstr)
       .stroke("white");

     d3.select("#patternsvg").call(t);
  }
 
    selected.style("opacity", 1)
        .style("fill", "url(#" + trimstr + ")");

    // .style("stroke", "yellow")
    // .style("stroke-width",2);
}

fB.deselect_bars = function(func, colors){
  d3.select("#func_bars")
    .selectAll(".g")
    .selectAll("rect")
    .filter(function(d) {
      return d.func == func;
    })
    //.style("opacity", 0.75)
    .style("fill", colors(func));
}

fB.select_contribution = function(taxon, colors, changeAlpha){
  var selected = d3.select("#func_bars")
    .selectAll(".g")
    .selectAll("rect")
    .filter(function(d) {
      return d.Taxa == taxon;
    });

  //selected.style("opacity", 1)
    selected.style("fill", function(d){
      var trimstr = d.func.replace(/\W+/g,'') + "_tx";
      if (d3.select("#" + trimstr)[0][0] == null) {
        var t = textures.lines()
          .thicker()
          .background(d3.rgb(colors(d.func)).brighter(0.4))
          .id(trimstr)
          .stroke("white");

        d3.select("#patternsvg").call(t);
      }

      return "url(#" + trimstr;
    });

}

fB.deselect_contribution = function(taxon, colors){
  selected = d3.select("#func_bars")
    .selectAll(".g")
    .selectAll("rect")
    .filter(function(d) {
      return d.Taxa == taxon;
    });
    selected.style("fill",function(d){ return colors(d.func); });
}

fB.select_single_contribution = function(taxon, func, colors, changeAlpha){
  selected = d3.select("#func_bars")
    .selectAll(".g")
    .selectAll("rect")
    .filter(function(d) {
      return d.func == func && d.Taxa == taxon;
    });
  var trimstr = func.replace(/\W+/g,'') + "_tx";
  if (d3.select("#" + trimstr)[0][0] == null) {
     var t = textures.lines()
       .thicker()
       .background(d3.rgb(colors(func)).brighter(0.4))
       .id(trimstr)
       .stroke("white");

     d3.select("#patternsvg").call(t);
  }
    
    selected.style("opacity", 1)
        .style("fill", "url(#" + trimstr + ")");
}

fB.deselect_single_contribution = function(taxon, func, colors){
  selected = d3.select("#func_bars")
    .selectAll(".g")
    .selectAll("rect")
    .filter(function(d) {
      return d.func == func && d.Taxa == taxon;
    });

    selected.style("fill", function(d){ return colors(d.func); });
}

this.fB = fB;
}();

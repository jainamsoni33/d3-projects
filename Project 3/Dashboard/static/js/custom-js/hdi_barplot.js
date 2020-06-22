function hdi_barplot(dataset)
{
    var data = dataset["map_HDI"].filter( (el) => (selected_countries.has(el.Entity)));

    var height = 660;
    var width = 170;

    var margin = {top: 40, right: 10, bottom: 30, left: 10},
    width = width - margin.left - margin.right,
    height = height - margin.top - margin.bottom;

    // set the ranges
    var y = d3.scaleBand()
            .range([height, 0])
            .padding(0);

    var x = d3.scaleLinear()
            .range([0, width]);

    d3.select("#hdi_barplot").selectAll("svg").remove();

    var svg = d3.select("#hdi_barplot")
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append('g')
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("text")
    .attr("y", 5 - margin.top)
    .attr("x",0 + 8*margin.left )
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Country HDI")
    .attr("font-weight", "bold");

    x.domain([0, d3.max(data, function(d){
        return d.HDI;
    })]);

    y.domain(data.map(function(d) { return d.Entity; }));

    // append the rectangles for the bar chart
    svg.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .style("fill", function (d) { 
            if(selected_countries.has(d.Entity)) { 
            return country_color_dict[d.Entity];}
        })
        .attr("width", function(d) {return x(d.HDI); } )
        .attr("y", function(d) { return y(d.Entity); })
        .attr("height", y.bandwidth())
        .append("text")
        .text(function (d) {
            return d.Entity;
        });

    // add the x Axis
    svg.append("g")
        .attr("transform", "translate(0," + "" + "-20)")
        .call(d3.axisBottom(x))
        
    // add the y Axis
    svg.append("g")
        .call(d3.axisLeft(y))
        .attr("transform", ("translate(" + String(width) + ",0)"))
        .select("path")
        .attr("stroke", "none");

    svg.selectAll("text")
        .attr("font-weight","bold");

}
function plotBarPlot(data_barplot)
{
    var dataset = data_barplot["bar_plot"];

    function get_list(data_obj)
    {
        var sortable = [];
        var to_keep = {};
        for (var key in data_obj) {
            if (selected_causes.has(key)) {
                to_keep[key] = data_obj[key];
            }
            else {
                sortable.push([key, data_obj[key]]);
            }
        }
        return [sortable, to_keep];
    }


    for(i=0;i<dataset.length;i++)
    {
        temp = get_list(dataset[i]);
        sortable = temp[0];
        to_keep = temp[1];
        to_keep["Country"] = sortable[0][1];

        extra_len = 10 - selected_causes.size + 1;

        sortable = sortable.slice(1, extra_len).sort(function(a, b){return b[1] - a[1]})
        // console.log(sortable);

        to_keep_2 = {}
        for (j = 0; j < sortable.length; j++) {
            to_keep_2[sortable[j][0]] = sortable[j][1];
        }
        // console.log(to_keep);
        // on top of barplot, will be selected causes, and on bottom would be extra other causes to compare
        to_keep = {...to_keep_2, ...to_keep};

        dataset[i] = to_keep;
    }

    //d3
    var height = $("#barplot").height();
    var width = $("#barplot").width();

    // console.log(height, width);

    var margin = {top: 10, right: 0, bottom: 0, left: 50};
    // width = 460 - margin.left - margin.right,
    // height = 400 - margin.top - margin.bottom;

    width = width - margin.left - margin.right,
    height = height - margin.top - margin.bottom;

    // console.log(height, width);

    d3.select("#barplot").selectAll("svg").remove();

    var svg = d3.select("#barplot")
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform",
                    "translate(" + margin.left + "," + margin.top + ")" + "scale(0.9, 0.85)");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x",0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Cause Percentage")
        .attr("font-weight", "bold");

    
    // helper
    function removeA(arr) {
        var what, a = arguments, L = a.length, ax;
        while (L > 1 && arr.length) {
            what = a[--L];
            while ((ax= arr.indexOf(what)) !== -1) {
                arr.splice(ax, 1);
            }
        }
        return arr;
    }

    // List of causes 
    var subgroups = removeA(Object.keys(dataset[0]), "Country")
    
    // List of countries = I show them on the X axis
    var groups = d3.map(dataset, function(d){return(d.Country)}).keys()

    var tooltip = d3.select("#barplot")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "1px")
        .style("border-radius", "5px")
        .style("padding", "10px")


    // Three function that change the tooltip when user hover / move / leave a cell
    var mouseover = function(d) {
        var subgroupName = d3.select(this.parentNode).datum().key;
        var subgroupValue = d.data[subgroupName];
        tooltip
            .html("Cause: " + subgroupName + "<br>" + "Percentage: " + subgroupValue)
            .style("opacity", 1)
    }
    var mousemove = function(d) {
        tooltip
        .style("left", (d3.mouse(this)[0]-10) + "px") // It is important to put the +90: other wise the tooltip is exactly where the point is an it creates a weird effect
        .style("top", (d3.mouse(this)[1]) + "px")
    }
    var mouseleave = function(d) {
        tooltip
        .style("opacity", 0)
    }

    // Add X axis
    var x = d3.scaleBand()
    .domain(groups)
    .range([0, width])
    .padding([0.2])


    svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x).tickSizeOuter(0))
    .selectAll("text")
    .attr("transform", "rotate(-20)")
    .attr("font-weight", "bold");

    // Add Y axis
    var y = d3.scaleLinear()
    .domain([0, 100])
    .range([ height, 0 ]);
    
    svg.append("g")
    .call(d3.axisLeft(y));

    
    //stack the data? --> stack per subgroup
    var stackedData = d3.stack()
                        .keys(subgroups)(dataset)


    //show the bars
    svg.append("g")
        .selectAll("g")
        .data(stackedData)
        .enter()
        .append("g")
        .attr("fill", function(d) { if(selected_causes.has(d.key)) { return "#FC6C66"; } return "#D2E2F2"; })
        .attr("class", function(d){ return "myRect " + d.key }) // Add a class to each subgroup: their name
        .selectAll("rect")
        .data(function(d) { return d; })
        .enter().append("rect")
        .attr("x", function(d) { return x(d.data.Country); })
        .attr("y", function(d) { return y(d[1]); })
        .attr("height", function(d) { return y(d[0]) - y(d[1]); })
        .attr("width",x.bandwidth())
        .attr("stroke", "black")
        .attr("stroke-width", "0.5")
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave);


}
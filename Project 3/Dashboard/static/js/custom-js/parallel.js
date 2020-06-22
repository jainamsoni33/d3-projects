function parallel_plot(data_parallel){

    var dataset = data_parallel["parallel"];

    var height = $("#parallel_coordinates").height(),
        width = $("#parallel_coordinates").width();

    var margin = {top: 50, right: 0, bottom: 30, left: 120};
    
    height = height - margin.top - margin.bottom;
    width = width - margin.left - margin.right;

    var columns_list = Array.from(selected_causes);
    columns_list.unshift("Country"); //Country will be the first vertical axis, followed by all diseases

    var dimensions = [
        {
            name : 'Country',
            scale : d3.scalePoint().range([0, height]),
            type : "string"
        },
    ];

    //every disease will have its own axis
    for(c of columns_list)
    {
        if(c == "Country")
        {
            continue;
        }
        else
        {
            dimensions.push(
                {
                    name : c,
                    scale : d3.scaleLinear().range([0, height]),
                    type : "number"
                }
            )
        }
    }

    var x = d3.scaleBand()  
                .domain(dimensions.map(function(d){
                    return d.name;
                }))
                .range([0,width]);

    var y ={}, dragging = {} ;

    var line = d3.line(),
        axis = d3.axisLeft(),
        background,
        foreground;

    d3.select("#parallel_coordinates").selectAll("svg").remove();

    var svg_parallel = d3.select('#parallel_coordinates')
                        .append("svg")
                        .attr("width", width + margin.left + margin.right)
                        .attr("height", height + margin.top + margin.bottom)
                        .append("g")
                        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var parallel_countries = Array.from(unique_countries);

    //total countries on country axis
    var total_len = 30;
    var remaining_len = total_len - selected_countries.size;
    var remaining_countries = new Set(parallel_countries.filter( ( el ) => !selected_countries.has( el ) ).slice(0, remaining_len));

    parallel_countries = new Set([...selected_countries, ...remaining_countries]);

    dataset = dataset.filter(
                            element => parallel_countries.has(element["Country"]) && element["Year"] == year
                    )
                    .map(element => Object.assign({}, ...columns_list.map(key => ({[key]: element[key]}))));


    dimensions.forEach(function(dimension){
        dimension.scale.domain(
            dimension.type === "number" ?
            d3.extent(dataset, function(d) { return +d[dimension.name]; })
            : dataset.map(function(d) { return d[dimension.name]; }).sort());
        });


     // Add grey background lines for context.
    background = svg_parallel.append('g')
                    .attr("class", "background")
                    .selectAll("path")
                    .data(dataset)
                    .enter()
                    .append("path")
                    .attr("d", path);

    // Add blue foreground lines for focus.
    foreground = svg_parallel.append("g")
                            .attr("class", "foreground")
                            .selectAll("path")
                            .data(dataset)
                            .enter()
                            .append("path")
                            .attr("d", path)
                            .style("stroke", function (d) {
                                // console.log(country_color_dict);
                                if (selected_countries.has(d["Country"])) {
                                    // console.log(country_color_dict[d["Country"]]);
                                    return country_color_dict[d["Country"]];
                                }
                            });


    // Add a group element for each dimension.
    var g = svg_parallel.selectAll(".dimension")
                .data(dimensions)
                .enter()
                .append('g')
                .attr("class", "dimension")
                .attr("transform", function(d) { return "translate(" + x(d.name) + ")"; })
                .call(d3.drag()
                        .subject(function(d) {
                            return {x : x(d.name)};
                        })
                        .on("start", function(d){
                            dragging[d.name] = x(d.name);
                            background.attr("visibility", "hidden");
                        })
                        .on("drag", function(d){
                            dragging[d.name] = Math.min(width, Math.max(0, d3.event.x));
                            foreground.attr("d", path);
                            //dimensions have shifted
                            dimensions.sort(function(a, b) { return position(a) - position(b); });
                            x.domain(dimensions.map(function(d) { return d.name; }));
                            g.attr("transform", function(d) { return "translate(" + position(d) + ")"; })
                        })
                        .on("end", function(d) {
                            delete dragging[d.name];
                            transition(d3.select(this)).attr("transform", "translate(" + x(d.name) + ")");
                            transition(foreground).attr("d", path);
                            
                            background
                            .attr("d", path)
                            .transition()
                            .delay(500)
                            .duration(0)
                            .attr("visibility", null);
                        })
                        
                
                );

    // Add an axis and title.

    g.append("g")
        .attr("class", "axis")
        .each(function(d) { 
                d3.select(this).call(axis.scale(d.scale))
                    .attr("fill", "black")
                })
        .append("text")
        .style("text-anchor", "middle")
        .style("font-size", "7px")
        .attr("class", "axis-label")
        .attr("y", -19)
        .attr("transform", "rotate(-10)")
        .text(function(d) { return d.name; });

    // // Add and store a brush for each axis.
    d3.select(".dimension")
        .append("g")
        .attr("class", "brush")
        .each(function(d) {       
            d3.select(this).call(d.scale.brush = d3.brushY()
                        .extent([[-10,0], [10,height]])
                        .on("start", brushstart)
                        .on("brush", brush)
                        .on("end", brushend))
        })
        .selectAll("rect")
        .attr("x", -8)
        .attr("width", 16);

    function position(d)
    {
        var v = dragging[d.name];
        return v == null ? x(d.name) : v;
    }

    function transition(g) {
        return g.transition().duration(500);
    }

    // TODO check for scaleBand here 
    // Returns the path for a given data point.
    function path(d) {
        //return line(dimensions.map(function(p) { return [position(p), y[p](d[p])]; }));
        return line(dimensions.map(function(dimension) {
            var v = dragging[dimension.name];
            var tx = v == null ? x(dimension.name) : v;
            // if (dimension.name == "Country") {
            //     console.log(dimension.scale(d[dimension.name]));
            // }
            
            return [tx, dimension.scale(d[dimension.name])];
        }));
    }

    function brushstart() {
        d3.event.sourceEvent.stopPropagation();
    }

    function brushend() {
        get_year_data(year, "parallel");
        update_actives();
    }

    function brush()
    {
        selected_countries = new Set();

        var actives = [];

        svg_parallel.selectAll(".brush")
            .filter(function(d){
                return d3.brushSelection(this);
            })
            .each(function(d){
                actives.push({
                    dimension : d,
                    extent : d3.brushSelection(this)
                });
            });
        
        actives = actives[0];

        if(actives)
        {
            // set un-brushed foreground line disappear
            foreground.style("display", function(d){
                const dim = actives.dimension;
                const country = d[dim.name];
                
                check = actives.extent[0] <= dim.scale(country) && dim.scale(country) <= actives.extent[1];
                if(check)
                {
                    selected_countries.add(country);
                    if(!(country in country_color_dict))
                    {
                        country_color_dict[country] = colors[colors_iterator % colors.length];
                        colors_iterator++;
                    }
                }
                return check ? null : "none";
            })
            .style("stroke", function(d){
                if (selected_countries.has(d["Country"])) {
                    // console.log(country_color_dict[d["Country"]]);
                    return country_color_dict[d["Country"]];
                }
            });
        }
        else
        {
            foreground.style('display', function(d) { return null;});
            if (!selected_countries.size) {
                selected_countries = new Set(["Albania", "Afghanistan", "Argentina"]);
            }
        }

    }


}
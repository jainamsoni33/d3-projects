var margin = { top: 100, right: 360, bottom: 500, left: 360 },
    width = screen.width - margin.left - margin.right,
    height = screen.height - margin.top - margin.bottom;

var svg = d3
    .select("#plot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom - 200)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var url = "Data/proj1.csv";
var dataset;

d3.csv(url, function (error, result) {
    if (error) return console.warn(error);
    dataset = result;
    var columns = Object.keys(dataset[0]);
    columns.splice(0, 1); // remove the extra column with no name
    columns.splice(columns.indexOf("Title"), 1); // remove Title column

    const categorical_vars = new Set([
        "Director",
        "Actor 1",
        "Actor 2",
        "Actor 3",
        "Language",
        "Country",
        "Content Rating",
        "Studio",
        "Release Date"
    ]);
    const numerical_vars = new Set([
        "Duration",
        "No. of critics for reviews",
        "No. of Facebook likes for Director",
        "No. of Facebook likes for Actor 3",
        "No. of Facebook likes for Actor 2",
        "No. of Facebook likes for Actor 1",
        "Gross Revenue",
        "No. of users who voted",
        "Total Facebook likes for cast",
        "No. of users for reviews",
        "Budget",
        "IMDb Score",
        "Aspect Ratio",
        "No. of Facebook likes for Movie",
        "Average Metacritic Score"
    ]);

    // change format of numerical values from string 
    dataset.forEach(function (d) {
        for (let item of numerical_vars) {
            d[item] = +d[item];
        }
    });

    d3.select("#dropdown")
        .selectAll("options")
        .data(columns)
        .enter()
        .append("option")
        .text(function (d) {
            return d;
        }) // text showed in the menu
        .attr("value", function (d) {
            return d;
        }); //value selected in dropdown

    // function to return top 25 frequent values of categorical variables
    function makeDict_categorical(selectedOption) {
        var month_map = {
            0: "January",
            1: "February",
            2: "March",
            3: "April",
            4: "May",
            5: "June",
            6: "July",
            7: "August",
            8: "September",
            9: "October",
            10: "November",
            11: "December"
        };
        var len = dataset.length;
        var freq_dict = {};

        for (var i = 0; i < len; i++) {
            var current = dataset[i];
            var curr_selectedOption = current[selectedOption];
            if(selectedOption == "Release Date") {
                var date = new Date(curr_selectedOption);
                curr_selectedOption = month_map[date.getMonth()];
            }
            if (!freq_dict.hasOwnProperty(curr_selectedOption)) {
                freq_dict[curr_selectedOption] = 0;
            }
            freq_dict[curr_selectedOption]++;
        }

        var all = Object.keys(freq_dict).map(function (key) {
            return [key, freq_dict[key]];
        });

        // Sort the array based on the second element i.e. frequency
        all.sort(function (first, second) {
            return second[1] - first[1];
        });
        var top_selectedOption = all.length > 25 ? all.slice(0, 25) : all;
        var result = [];
        for (var key in top_selectedOption) {
            if (top_selectedOption.hasOwnProperty(key)) {
                var obj = {};
                var freq;
                obj["attribute"] = top_selectedOption[key][0];
                obj["frequency"] = top_selectedOption[key][1];
                result.push(obj);
            }
        }
        return result;
    }

    // Categorical variable plot:
    function updateCategorical(col_name, data) {
        svg.selectAll("rect").remove();
        svg.selectAll("g").remove();
        svg.selectAll("text").remove();

        // Define the axes
        var x = d3
            .scaleBand()
            .range([0, width])
            .padding(0.3);
        var xAxis = svg
            .append("g")
            .attr("transform", "translate(0," + height + ")");

        var y = d3.scaleLinear().range([height, 0]);
        var yAxis = svg.append("g").attr("class", "yAxis");

        // Update the X axis
        x.domain(
            data.map(function (d) {
                return d["attribute"];
            })
        );
        xAxis
            .transition()
            .duration(1000)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-65)");

        // Update the Y axis
        y.domain([
            0,
            d3.max(data, function (d) {
                return d["frequency"];
            })
        ]);
        yAxis
            .transition()
            .duration(1000)
            .call(d3.axisLeft(y));

        // Create the u variable
        var u = svg.selectAll("rect").data(data);

        u.enter()
            .append("rect") // Add a new rect for each new elements
            .attr("id", function (d, i) {
                var result = "rect" + i.toString();
                return result;
            })
            .merge(u) // get the already existing elements as well
            .transition() // and apply changes to all of them
            .duration(1000)
            .attr("x", function (d) {
                return x(d["attribute"]);
            })
            .attr("y", function (d) {
                return y(d["frequency"]);
            })
            .attr("width", x.bandwidth())
            .attr("height", function (d) {
                return height - y(d["frequency"]);
            })
            .attr("fill", "#242582");

        u.enter()
            .append("text")
            .attr("id", function (d, i) {
                var result = "rect" + i.toString() + "text";
                return result;
            })
            .attr("x", function (d, i) {
                x_rect = d3.select("#rect" + i.toString()).attr("x");
                width_rect = d3.select("#rect" + i.toString()).attr("width");
                return x_rect + width_rect / 2;
            })
            .attr("y", function (d, i) {
                y_rect = d3.select("#rect" + i.toString()).attr("y");
                return y_rect - 12;
            })
            .style("position", "relative")
            .attr("transform", function (d) {
                return "translate(" + x(d["attribute"]) + "," + y(d["frequency"]) + ")";
            })
            .text(function (d) {
                return d["frequency"];
            })
            .attr("font-family", "sans-serif")
            .style("visibility", "hidden");

        svg
            .selectAll("rect")
            .on("mouseover", function (d, i) {
                var initX = d3.select(this).attr("x");
                var initY = d3.select(this).attr("y");
                var initWidth = d3.select(this).attr("width");
                var initHeight = d3.select(this).attr("height");
                d3.select(this)
                    .transition()
                    .duration(100)
                    .attr("x", initX - initWidth / 4)
                    .attr("y", initY - 10)
                    .attr("width", initWidth * 1.5)
                    .attr("height", parseFloat(initHeight) + 10.0)
                    .style("fill", "#f64c72");
                d3.select("#" + this.id + "text").style("visibility", "visible");
            })
            .on("mouseout", function (d, i) {
                d3.select(this)
                    .transition()
                    .duration(100)
                    .attr("x", function (d) {
                        return x(d["attribute"]);
                    })
                    .attr("y", function (d) {
                        return y(d["frequency"]);
                    })
                    .attr("width", x.bandwidth())
                    .attr("height", function (d) {
                        return height - y(d["frequency"]);
                    })
                    .style("fill", "#242582");
                d3.select("#" + this.id + "text").style("visibility", "hidden");
            });

        // Label for x-axis
        svg
            .append("text")
            .attr(
                "transform",
                "translate(" + width / 2 + " ," + (height + margin.bottom - 350) + ")"
            )
            .attr("font-family", "sans-serif")
            .style("text-anchor", "middle")
            .text(col_name);

        // Label for y-axis
        svg
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left + 300)
            .attr("x", 0 - height / 2)
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .attr("font-family", "sans-serif")
            .text("Frequency");

        u.exit().remove();
        xAxis.exit().remove();
    }

    // Numerical variable plot
    function updateNumerical(col_name, data, nBin, isSelectedNumerical) {

        svg.selectAll("rect").remove();
        svg.selectAll("g").remove();
        svg.selectAll("text").remove();

        var x = d3
            .scaleLinear()
            .domain([
                0,
                d3.max(data, function (d) {
                    return +d[col_name];
                })
            ]) 
            .range([0, width]);
        
        svg
        .append("g")
        .attr("transform", "translate(0," + height + ")")
        .transition()
        .duration(1000)
        .call(d3.axisBottom(x));

        

        var histogram = d3
            .histogram()
            .value(function (d) {
                return d[col_name];
            }) 
            .domain(x.domain())
            .thresholds(x.ticks(nBin)); 

        var bins = histogram(data);

        var y = d3.scaleLinear().range([height, 0]);
        y.domain([
            0,
            d3.max(bins, function (d) {
                return d.length;
            })
        ]); 
        svg
            .append("g")
            .transition()
            .duration(1000)
            .call(d3.axisLeft(y));

        var u = svg.selectAll("rect").data(bins);

        if(!isSelectedNumerical) {
            u.enter()
            .append("rect") // Add a new rect for each new elements
            .attr("id", function (d, i) {
                var result = "rect" + i.toString();
                return result;
            })
            .transition() // and apply changes to all of them
            .duration(1000)
            .attr("x", 1)
            .attr("y", 0)
            .attr("transform", function (d) {
                return "translate(" + x(d.x0) + "," + y(d.length) + ")";
            })
            .attr("width", function (d) {
                return (x(d.x1) - x(d.x0) - 1) * 0.6;
            })
            .attr("height", function (d) {
                return height - y(d.length);
            })
            .style("fill", "#242582");
        }
        else {
            u.enter()
            .append("rect") // Add a new rect for each new elements
            .attr("id", function (d, i) {
                var result = "rect" + i.toString();
                return result;
            })
            .attr("y", 0)
            .attr("transform", function (d) {
                return "translate(" + x(d.x0) + "," + y(d.length) + ")";
            })
            .attr("width", function (d) {
                return (x(d.x1) - x(d.x0) - 1) * 0.6;
            })
            .attr("height", function (d) {
                return height - y(d.length);
            })
            .style("fill", "#242582");
        }
       

        u.enter()
            .append("text")
            .attr("id", function (d, i) {
                var result = "rect" + i.toString() + "text";
                return result;
            })
            .attr("x", function (d, i) {
                x_rect = d3.select("#rect" + i.toString()).attr("x");
                width_rect = d3.select("#rect" + i.toString()).attr("width");
                return x_rect + width_rect / 2;
            })
            .attr("y", function (d, i) {
                y_rect = d3.select("#rect" + i.toString()).attr("y");
                return y_rect - 12;
            })
            .attr("transform", function (d) {
                return "translate(" + x(d.x0) + "," + y(d.length) + ")";
            })
            .text(function (d) {
                return d.length;
            })
            .attr("font-family", "sans-serif")
            .style("visibility", "hidden");

        svg
            .selectAll("rect")
            .on("mouseover", function (d, i) {
                var initX = d3.select(this).attr("x");
                var initWidth = d3.select(this).attr("width");
                var initHeight = d3.select(this).attr("height");
                d3.select(this)
                    .transition()
                    .duration(100)
                    .attr("x", initX-initWidth*0.2)
                    .attr("width", function (d) {
                        return (x(d.x1) - x(d.x0) - 1)
                    })
                    .attr("y", -10)
                    .attr("height", parseFloat(initHeight)+10)
                    .style("fill", "#f64c72");
                d3.select("#" + this.id + "text").style("visibility", "visible");
            })
            .on("mouseout", function (d, i) {
                var initY = d3.select(this).attr("y");
                d3.select(this)
                    .transition()
                    .duration(100)
                    .attr("x", 1)
                    .attr("y", 0)
                    .attr("width", function (d) {
                        return (x(d.x1) - x(d.x0) - 1) * 0.6;
                    })
                    .attr("height", function (d) {
                        return height - y(d.length);
                    })
                    .style("fill", "#242582");
                d3.select("#" + this.id + "text").style("visibility", "hidden");
            });

        // Label for x-axis
        svg
            .append("text")
            .attr(
                "transform",
                "translate(" + width / 2 + " ," + (height + margin.bottom - 420) + ")"
            )
            .attr("font-family", "sans-serif")
            .style("text-anchor", "middle")
            .text(col_name);

        // Label for y-axis
        svg
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left + 300)
            .attr("x", 0 - height / 2)
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .attr("font-family", "sans-serif")
            .text("Frequency");

        u.exit().remove();
    }
        
    var selectedOption;
    var nBins = 10;
    var isSelectedNumerical = false;

    var slider = d3
            .sliderHorizontal()
            .min(10)
            .max(50)
            .step(5)
            .width(300)
            .fill("#242582")
            .displayValue(true)
            .on("onchange", val => {
                isSelectedNumerical = true;
                nBins = val;
                if (numerical_vars.has(selectedOption)) {
                    updateNumerical(selectedOption, dataset, parseInt(nBins), isSelectedNumerical);
                }
            });
        
        
    d3.select("#dropdown").on("change", function (d) {
        selectedOption = d3.select(this).property("value");
        isSelectedNumerical = false;

        // categorical variables
        if (categorical_vars.has(selectedOption)) {
            freq_json = makeDict_categorical(selectedOption);
            
            updateCategorical(selectedOption, freq_json);
        }

        // numerical variables
        else if (numerical_vars.has(selectedOption)) {
            updateNumerical(selectedOption, dataset, parseInt(nBins), isSelectedNumerical);
        }
    });

    d3.select("#slider")
        .append("svg")
        .attr("width", 600)
        .attr("height", 150)
        .attr("transform", "translate(320,40)")
        .append("g")
        .attr("transform", "translate(250,40)")
        .call(slider);


    freq_json = makeDict_categorical("Director");
    updateCategorical("Director", freq_json);
});
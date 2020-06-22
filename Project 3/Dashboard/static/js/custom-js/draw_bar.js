function draw_bar(cv_data, width, height) {
    margin = { top: 25, right: 25, bottom: 25, left: 25 }

    data = []
    for(i in cv_data){
        country_code_confirmed = {}
        country_list = cv_data[i]
        country_code = country_list[0][2]
        country_name = country_list[0][5]
        country_cases = d3.sum(country_list, function(d){return d[ylabel_index]})
        country_code_confirmed["Country Code"] = country_code
        country_code_confirmed["Country"] = country_name
        country_code_confirmed["TotalConfirmed"] = country_cases
        data.push(country_code_confirmed)
    }


    var y = d3.scaleBand()
        .range([height - 4 * margin.top, 0])
        .padding(0);

    var x = d3.scaleLinear()
        .range([0, width - 2 * margin.left]);

    var svg = d3.select("#barchart").append("svg")
        .attr("width", width)
        .attr("height", height - margin.top)
        .style('overflow-y', 'scroll')
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + 2 * margin.top + ")")
        ;
    i = 0
    reduced = []
    data.forEach(function (d) {
        d.TotalConfirmed = +d.TotalConfirmed

        if (d['Country Code'] == 'USA') {
            d.Country = d['Country Code']
        }
        if (d.TotalConfirmed > 5000) {
            reduced[i] = d
            i += 1
        }

    })


    data = reduced
    data.sort(function(x,y){
        return d3.descending(x.TotalConfirmed, x.TotalConfirmed)
    })

    x.domain([0, d3.max(data, function (d) { return d.TotalConfirmed; })])
    y.domain(data.map(function (d) { return d.Country; }));

    svg.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("id", (d) => d['Country Code'])
        .attr("width", function (d) { return x(d.TotalConfirmed); })
        .attr("y", function (d) { return y(d.Country); })
        .attr("height", y.bandwidth())
        .append("text")
        .text(function (d) {
            return d.Country
        })
        ;

    // add the x Axis
    svg.append("g")
        .attr("transform", "translate(0," + (- 20) + ")")
        .call(d3.axisBottom(x).tickFormat(d3.formatPrefix(".1", 1e6)))
        .style('stroke', '#fff');

    // add the y Axis
    svg.append("g")
        .call(d3.axisLeft(y))
        .style('stroke', '#fff')
        .selectAll('.tick')
        .attr("transform", function (d) {
            string = d3.select(this).attr('transform');
            translate = string.substring(string.indexOf("(") + 1, string.indexOf(")")).split(",");
            return 'translate(200,' + translate[1] + ')'
        })
        ;


}
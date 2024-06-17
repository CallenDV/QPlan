document.getElementById('dataForm').addEventListener('submit', function(event) {
    event.preventDefault();
    let fileInput = document.getElementById('csvFile');
    let file = fileInput.files[0];
    if (file) {
        let reader = new FileReader();
        reader.readAsText(file);
        reader.onload = function(e) {
            processData(e.target.result, 'csv');
        };
    }
});

document.getElementById('visualizeButton').addEventListener('click', function() {
    let inputData = document.getElementById('manualInput').value.trim();
    processData(inputData, 'manual');
});

function processData(data, dataType) {
    let dataset = [];

    if (dataType === 'csv') {
        dataset = parseCSV(data);
    } else if (dataType === 'manual') {
        dataset = parseManualInput(data);
    }

    document.getElementById('chartsContainer').innerHTML = '';
    createBarChart(dataset);
}

function parseCSV(csvData) {
    let rows = csvData.split('\n');
    let dataset = rows.map(row => {
        let values = row.split(',');
        return { category: values[0], value: parseFloat(values[1]) };
    });

    if (dataset.length > 0 && (dataset[0].category === 'category' || dataset[0].category.toLowerCase() === "category")) {
        dataset.shift();
    }

    return dataset;
}

function parseManualInput(inputData) {
    let rows = inputData.split('\n');
    let dataset = rows.map(row => {
        let values = row.split(',');
        return { category: values[0], value: parseFloat(values[1]) };
    });

    return dataset;
}

function createBarChart(data) {
    let svgWidth = 600, svgHeight = 400;
    let margin = { top: 50, right: 20, bottom: 50, left: 50 };
    let width = svgWidth - margin.left - margin.right;
    let height = svgHeight - margin.top - margin.bottom;

    let svg = d3.select('#chartsContainer').append('svg')
        .attr('width', svgWidth)
        .attr('height', svgHeight)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    let x = d3.scaleBand()
        .range([0, width])
        .padding(0.1)
        .domain(data.map(d => d.category));

    let y = d3.scaleLinear()
        .range([height, 0])
        .domain([0, d3.max(data, d => d.value)]);

    svg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', 'translate(0,' + height + ')')
        .call(d3.axisBottom(x));

    svg.append('g')
        .attr('class', 'y-axis')
        .call(d3.axisLeft(y));

    let bars = svg.selectAll('.bar')
        .data(data)
        .enter().append('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d.category))
        .attr('width', x.bandwidth())
        .attr('y', d => y(d.value))
        .attr('height', d => height - y(d.value))
        .attr('fill', 'steelblue')
        .on('mouseover', function(d) {
            d3.select(this).attr('fill', 'orange');
        })
        .on('mouseout', function(d) {
            d3.select(this).attr('fill', 'steelblue');
        })
        .attr('data-category', d => d.category)
        .attr('data-value', d => d.value);

    bars.append('title')
        .text(d => `Category: ${d.category}\nValue: ${d.value}`);

    svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + margin.top / 2)
        .style('text-anchor', 'middle')
        .text('Categories');

    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 0 - margin.left / 2)
        .attr('x', 0 - (height / 2))
        .attr('dy', '1em')
        .style('text-anchor', 'middle')
        .text('Values');

    document.getElementById('exportPNGButton').addEventListener('click', function() {
        exportChartAsPNG(svg);
    });

    document.getElementById('sortButton').addEventListener('click', function() {
        sortDataByValue(svg, bars);
    });

    document.getElementById('colorPicker').addEventListener('change', function() {
        changeBarColor(bars, this.value);
    });

    svg.attr('viewBox', `0 0 ${svgWidth} ${svgHeight}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');
}

function exportChartAsPNG(svg) {
    let canvas = document.createElement('canvas');
    let svgString = new XMLSerializer().serializeToString(svg.node());
    let ctx = canvas.getContext('2d');

    let DOMURL = window.URL || window.webkitURL || window;
    let img = new Image();
    let svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    let url = DOMURL.createObjectURL(svgBlob);

    img.onload = function() {
        ctx.drawImage(img, 0, 0);
        DOMURL.revokeObjectURL(url);

        let imgData = canvas.toDataURL('image/png');
        let link = document.createElement('a');
        link.href = imgData;
        link.download = 'chart.png';
        link.click();
    };

    img.src = url;
}

function sortDataByValue(svg, bars) {
    let currentData = [];
    bars.each(function() {
        let bar = d3.select(this);
        let category = bar.attr('data-category');
        let value = parseFloat(bar.attr('data-value'));
        currentData.push({ category: category, value: value });
    });

    currentData.sort((a, b) => b.value - a.value);

    let x = d3.scaleBand()
        .range([0, svg.attr('width') - 100])
        .padding(0.1)
        .domain(currentData.map(d => d.category));

    bars.data(currentData, d => d.category)
        .transition()
        .duration(500)
        .attr('x', d => x(d.category));

    svg.select('.x-axis')
        .transition()
        .duration(500)
        .call(d3.axisBottom(x));
}

function changeBarColor(bars, color) {
    bars.attr('fill', color);
}

/*global $ */
$(document).ready(() => {
    const dataTable = $('#pipeline').DataTable({
        data: [],
        columns: [
            { title: "Associated Company" },
            { title: "Deal Name" },
            { title: "Deal Stage" },
            { title: "Close Date" },
            { title: "Deal owner" },
            { title: "Amount" },
            { title: "Deal Description" }
        ],
        buttons: [
            'copy', 'csv', 'excel', 'pdf', 'print'
        ],
        dom: 'Blfrtip',
        order: [[2, "asc"], [3, "asc"]],
        footerCallback: function (row, data, start, end, display) {
            var api = this.api();
            var amountColIndex = 5;

            // Remove the formatting to get integer data for summation
            var intVal = function (i) {
                return typeof i === 'string' ?
                    i.replace(/[\$,]/g, '') * 1 :
                    typeof i === 'number' ?
                        i : 0;
            };

            // Total over entire dataset
            total = api
                .column(amountColIndex)
                .data()
                .reduce(function (a, b) {
                    return intVal(a) + intVal(b);
                }, 0);

            // Total over filtered items
            filteredTotal = api
                .column(amountColIndex, { page: 'all', search: 'applied' })
                .data()
                .reduce(function (a, b) {
                    return intVal(a) + intVal(b);
                }, 0);

            // Update footer
            $(api.column(amountColIndex).footer()).html(
                '$' + filteredTotal + ' ( $' + total + ' total)'

            );
        },
        initComplete: function () {

        }
    });

    updateData = (newData) => {
        dataTable.clear();
        dataTable.rows.add(newData);
        dataTable.draw();
        dataTable.columns([0, 1, 2, 3, 4,]).every(function () {
            var column = this;
            var select = $('<select><option value=""></option></select>')
                .appendTo($(column.header()))
                .on('change', function () {
                    var val = $.fn.dataTable.util.escapeRegex(
                        $(this).val()
                    );

                    column
                        .search(val ? '^' + val + '$' : '', true, false)
                        .draw();
                });

            column.data().unique().sort().each(function (d, j) {
                select.append('<option value="' + d + '">' + d + '</option>')
            });
        });
    }

    preprocessData = (data) => {
        var output = data.map(innerObject => {
            const innerArray = [];
            innerArray.push(innerObject['Associated Company']);
            innerArray.push(innerObject['Deal Name']);
            innerArray.push(innerObject['Deal Stage']);
            innerArray.push(innerObject['Close Date']);
            innerArray.push(innerObject['Deal owner']);
            innerArray.push(innerObject[' Amount ']);
            innerArray.push(innerObject['Deal Description']);

            return innerArray;
        });


        output = output.filter(row => {
            const dealStageColIndex = 2;
            const dealStage = row[dealStageColIndex];
            return !!dealStage;
        });
        return output;
    }

    uploadExcelFile = (event) => {
        var reader = new FileReader();
        reader.onload = function (e) {
            var data = e.target.result;
            var workbook = XLSX.read(data, {
                type: 'binary'
            });
            if (workbook.SheetNames.includes('Pipe per stage')) {
                var XL_row_object = XLSX.utils.sheet_to_row_object_array(workbook.Sheets['Pipe per stage']);
                console.log('from XLSX', XL_row_object);
                const preprocessedData = preprocessData(XL_row_object);
                updateData(preprocessedData);

            } else {
                alert('Cannot find sheet with name "Pipe per stage"');
            }
        };
        reader.onerror = function (ex) {
            console.log(ex);
        };
        reader.readAsBinaryString(event.target.files[0]);
    }
});

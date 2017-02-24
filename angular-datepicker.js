angular.module("angular-datepicker", []).directive("datepicker", ['$timeout', 'padFilter', function ($timeout, padFilter) {
    return {
        restrict: "A",
        scope: {
            options: "=?options",
            model: "=model",
            disabled: "=?datepickerDisabled",
            fromDate: "=?fromDate",
            toDate: "=?toDate",
            standardDate: "=?standardDate",
            events: "=?"
        },
        controller: ['$scope', function ($scope) {

            if (/^-?\d+$/.test($scope.model)) {
                $scope.modelDate = new Date($scope.model);
            } else if (angular.isDate($scope.model)) {
                $scope.modelDate = angular.copy($scope.model);
            } else if ($scope.model) {
                throw "Model format is wrong, only timestamp or javascript date object are supported";
            }

            $scope.opened = false;
            $scope.daySelectionOpened = false;

            // if ($scope.fromDate) {
            //     $scope.fromDate.setUTCHours(0);
            //     $scope.fromDate.setUTCMinutes(0);
            //     $scope.fromDate.setUTCSeconds(0);
            //     $scope.fromDate.setUTCMilliseconds(0);
            // }


            // if ($scope.toDate) {
            //     $scope.toDate.setUTCHours(0);
            //     $scope.toDate.setUTCMinutes(0);
            //     $scope.toDate.setUTCSeconds(0);
            //     $scope.toDate.setUTCMilliseconds(0);
            // }

            var defaultMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "Settember", "October", "November", "December"];
            var defaultDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
            var defaultCleanName = "Clean";
            var defaultSelectName = "Select";
            var defaultDateFormat = "dd/MM/yyyy";
            var defaultTimes = {
                step: 1800,
                from: 0,
                to: 86399
            };
            var defaultTimepicker = false;

            if ($scope.options) {
                $scope.monthNames = $scope.options.monthNames || defaultMonths;
                $scope.dayNames = $scope.options.dayNames || defaultDays;
                $scope.cleanName = $scope.options.cleanName || defaultCleanName;
                $scope.selectName = $scope.options.selectName || defaultSelectName;
                $scope.dateFormat = $scope.options.dateFormat || defaultDateFormat;
                $scope.times = $scope.options.times || defaultTimes;
                $scope.timepicker = $scope.options.timepicker || defaultTimepicker;
            } else {
                $scope.monthNames = defaultMonths;
                $scope.dayNames = defaultDays;
                $scope.cleanName = defaultCleanName;
                $scope.selectName = defaultSelectName;
                $scope.dateFormat = defaultDateFormat;
                $scope.times = defaultTimes;
                $scope.timepicker = defaultTimepicker;
            }

            if (!$scope.events) {
                $scope.events = {};
            }

            $scope.generatedTimes = [];
            for (var i = $scope.times.from; i < $scope.times.to; i += $scope.times.step) {
                var tmpDate = new Date(i * 1000);
                var tmpObj = {
                    hour: tmpDate.getUTCHours(),
                    minute: tmpDate.getUTCMinutes(),
                    second: tmpDate.getUTCSeconds(),
                    label:  padFilter(tmpDate.getUTCHours())+":"+ padFilter(tmpDate.getUTCMinutes()) +":"+padFilter(tmpDate.getUTCSeconds())
                };
                $scope.generatedTimes.push(tmpObj);
                
                if ($scope.modelDate && $scope.modelDate.getHours() == tmpObj.hour && $scope.modelDate.getMinutes() == tmpObj.minute && $scope.modelDate.getSeconds() == tmpObj.second) {
                    $scope.selectedTime = tmpObj;
                }
            }


            $scope.generateMonth = function (selectedDate) {
                // selectedDate.setUTCHours(0);
                // selectedDate.setUTCMinutes(0);
                // selectedDate.setUTCSeconds(0);
                // selectedDate.setUTCMilliseconds(0);

                var today = new Date();
                today.setUTCHours(0);
                today.setUTCMinutes(0);
                today.setUTCSeconds(0);
                today.setUTCMilliseconds(0);

                var startDate = new Date(Date.UTC(selectedDate.getUTCFullYear(), selectedDate.getUTCMonth(), 1));

                while (startDate.getUTCDay() != 1) {
                    startDate = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);
                }


                var endDate = new Date(Date.UTC(selectedDate.getUTCFullYear(), selectedDate.getUTCMonth() + 1, 0));
                while (endDate.getUTCDay() != 0) {
                    endDate = new Date(endDate.getTime() + 24 * 60 * 60 * 1000);
                }

                var tmpDay = startDate;

                var month = {
                    weeks: [],
                    name: selectedDate.getUTCDate() + "-" + (selectedDate.getUTCMonth() + 1) + "-" + selectedDate.getUTCFullYear(),
                    selectedDate: selectedDate,
                    number: selectedDate.getUTCMonth()
                };

                var week = 0;
                while (tmpDay.getTime() <= endDate.getTime()) {

                    if (tmpDay.getUTCDay() == 1) {
                        week++;
                    }

                    var isDisabled = false;
                    if ($scope.fromDate && tmpDay.getTime() < $scope.fromDate.getTime() ||
                        $scope.toDate && tmpDay.getTime() > $scope.toDate.getTime()) {
                        isDisabled = true;
                    }

                    var jsonDay = {
                        number: tmpDay.getUTCDate(),
                        isSelectedDate: $scope.modelDate && tmpDay.getTime() === $scope.modelDate.getTime(),
                        isToday: tmpDay.getTime() === today.getTime(),
                        date: tmpDay,
                        differentMonth: tmpDay.getUTCMonth() !== selectedDate.getUTCMonth(),
                        isDisabled: isDisabled
                    };
                    if (!month.weeks[week]) {
                        month.weeks[week] = [];
                    }
                    month.weeks[week].push(jsonDay);
                    tmpDay = new Date(tmpDay.getTime() + 24 * 60 * 60 * 1000);

                }
                $scope.month = month;

                $scope.years = [];

                var count = 0;
                for (var num = $scope.month.selectedDate.getUTCFullYear() - 17; num <= $scope.month.selectedDate.getUTCFullYear() + 17; num++) {
                    if (!$scope.years[count]) {
                        $scope.years[count] = [];
                    }
                    $scope.years[count].push({
                        num: num,
                        isActualYear: today.getUTCFullYear() === num,
                        isSelectedYear: $scope.modelDate && $scope.modelDate.getUTCFullYear() === num
                    });
                    if ($scope.years[count].length === 5) {
                        count++;
                    }
                }

            };


            if (!$scope.standardDate) {
                $scope.standardDate = new Date();
            }

            if ($scope.modelDate) {
                // $scope.modelDate.setUTCHours(0);
                // $scope.modelDate.setUTCMinutes(0);
                // $scope.modelDate.setUTCSeconds(0);
                // $scope.modelDate.setUTCMilliseconds(0);
                $scope.generateMonth(angular.copy($scope.modelDate));
            } else {
                $scope.generateMonth($scope.standardDate);

            }


            $scope.selectDay = function (date) {
                $scope.modelDate = date;
                $scope.generateMonth(angular.copy(date));
            };

            $scope.addMonth = function (selectedDate) {

                selectedDate.setUTCMonth(selectedDate.getUTCMonth() + 1);
                $scope.generateMonth(selectedDate);
            };

            $scope.subMonth = function (selectedDate) {
                selectedDate.setUTCMonth(selectedDate.getUTCMonth() - 1);
                $scope.generateMonth(selectedDate);
            };


            $scope.getPreviousMonthName = function () {
                if ($scope.month.number > 0) {
                    return $scope.monthNames[$scope.month.number - 1].substr(0, 3);
                } else {
                    return $scope.monthNames[11].substr(0, 3);
                }
            };

            $scope.getSuccessiveMonthName = function () {
                if ($scope.month.number < 11) {
                    return $scope.monthNames[$scope.month.number + 1].substr(0, 3);
                } else {
                    return $scope.monthNames[0].substr(0, 3);
                }
            };


            $scope.selectYear = function (year) {
                $scope.toggleYearSelection();
                var newDate = angular.copy($scope.month.selectedDate);
                newDate.setUTCFullYear(year);
                $scope.generateMonth(newDate);
            };

            $scope.toggleYearSelection = function () {
                $scope.yearSelectionOpened = !$scope.yearSelectionOpened;
                $scope.daySelectionOpened = !$scope.daySelectionOpened;
            };


            $scope.precYears = function () {
                var newDate = angular.copy($scope.month.selectedDate);
                newDate.setUTCFullYear(newDate.getUTCFullYear() - 21);
                $scope.generateMonth(newDate);
            };

            $scope.succYears = function () {
                var newDate = angular.copy($scope.month.selectedDate);
                newDate.setUTCFullYear(newDate.getUTCFullYear() + 21);
                $scope.generateMonth(newDate);
            };

            $scope.clear = function () {
                $scope.modelDate = null;
                $scope.selectedTime = null;
                $scope.opened = false;
                $scope.generateMonth($scope.standardDate);
            };

            $scope.changeTime = function (time) {
                $scope.modelDate.setHours(time.hour);
                $scope.modelDate.setMinutes(time.minute);
                $scope.modelDate.setSeconds(time.second);
            }

            $scope.close = function () {
                $scope.opened = false;
                $scope.model = $scope.modelDate.getTime();

                $timeout(function () {
                    $scope.events.onDaySelected && $scope.events.onDaySelected();
                });
            }

        }],
        template: '<div class="datepicker"> <div data-ng-click="opened=!disabled;daySelectionOpened=!disabled" class="selectable"><i class="fa fa-calendar"></i> {{modelDate | date: dateFormat | datepickerEmptyFilter: dateFormat}}</div> <div class="datepicker-wrapper" data-ng-show="opened" data-ng-click="opened=!opened;daySelectionOpened=true;yearSelectionOpened=false;"></div><div class="datepicker-close" data-ng-show="opened" data-ng-click="opened=!opened;daySelectionOpened=true;yearSelectionOpened=false;"> <button type="button"></button> </div><div class="datepicker-table-wrapper table" data-ng-show="daySelectionOpened && opened"> <table> <thead> <tr class="month-header"> <th><a data-ng-click="subMonth(month.selectedDate)">{{getPreviousMonthName()}}</a></th> <th colspan="5" data-ng-click="toggleYearSelection()"> <button class="button-month" type="button">{{monthNames[month.selectedDate.getMonth()]}} {{month.selectedDate.getFullYear()}}</button> </th> <th><a data-ng-click="addMonth(month.selectedDate)">{{getSuccessiveMonthName()}}</a></th> </tr><tr> <th data-ng-repeat="d in dayNames">{{d | substring}}</th></tr></thead> <tbody> <tr data-ng-repeat="week in month.weeks"> <td data-ng-click="!day.isDisabled && selectDay(day.date)" data-ng-repeat="day in week" data-ng-class="{\'disabled\': day.isDisabled,\'selected-date\': day.isSelectedDate, \'today\': day.isToday, \'different-month\': !day.isDisabled && day.differentMonth}"><a>{{day.number}}</a></td></tr><tr> <td colspan="3"><select class="timeselect" data-ng-if="timepicker" data-ng-disabled="!modelDate" data-ng-model="selectedTime" ng-options="t.label for t in generatedTimes" data-ng-change="changeTime(selectedTime)"></select></td><td colspan="4"> <button style="margin-left: 5px" class="datepicker-button-clear" data-ng-disabled="!modelDate" data-ng-click="close()">Select</button> <button type="button" class="datepicker-button-clear" data-ng-click="clear()">{{cleanName}}</button> </td></tr></tbody> </table> </div><div class="datepicker-table-wrapper table" data-ng-show="yearSelectionOpened && opened"> <table> <thead> <tr class="month-header"> <th><a data-ng-click="precYears()">prev</a></th> <th colspan="3">{{years[0][0].num}}-{{years[years.length - 1][years[years.length - 1].length - 1].num}}</th> <th><a data-ng-click="succYears()">next</a></th> </tr></thead> <tbody> <tr data-ng-repeat="list in years"> <td data-ng-repeat="year in list" data-ng-click="selectYear(year.num)" data-ng-class="{\'selected-date\': year.isSelectedYear, \'today\': year.isActualYear}"> <a>{{year.num}}</a> </td></tr><tr></tr></tbody> </table> </div></div>'

    };
}]).filter("datepickerEmptyFilter", function () {
    return function (input, placeholder) {
        var placeholder = placeholder || "---";
        if (!input)
            return placeholder;
        return input;
    };
})
    .filter("substring", function () {
        return function (input, to, from) {
            var from = from || 0;
            var to = to || 3;
            if (input) {
                return input.substr(from, to);
            }
        }
    })
    .filter('pad', function () {
        return function pad(n, width, z) {
            z = z || '0';
            width = width || 2;
            n = n + '';
            return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
        }
    })
    ;

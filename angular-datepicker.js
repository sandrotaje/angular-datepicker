angular.module("angular-datepicker", []).directive("datepicker", ['$timeout', 'padFilter', '$filter', '$compile', function ($timeout, padFilter, $filter, $compile) {
    return {
        restrict: "A",
        scope: {
            options: "=?options",
            disabled: "=?datepickerDisabled",
            fromDate: "=?fromDate",
            toDate: "=?toDate",
            standardDate: "=?standardDate",
            events: "=?"
        },
        require: 'ngModel',
        link: function ($scope, elem, attrs, ngModel) {

            var first = true;

            ngModel.$render = function () {
                var html = elem.contents();
                elem.empty();
                if (!ngModel.$modelValue) {
                    elem.html($scope.emptyString);
                } else {
                    elem.html($filter("date")(ngModel.$modelValue, $scope.dateFormat));
                }
                elem.on("click", function () {
                    $scope.$applyAsync(function () {
                        $scope.opened = true;
                        $scope.daySelectionOpened = true;
                    });
                });
                if (first) {
                    first = false;
                    elem.after($compile(html)($scope));
                }
            };

            ngModel.$parsers.push(function (value) {
                return Date.parse(value);
            });

            ngModel.$formatters.push(function (value) {
                if (/^-?\d+$/.test(value)) {
                    $scope.generateMonth(new Date(value));
                    return $filter("date")(value, $scope.dateFormat);
                } else if (angular.isDate(value)) {
                    $scope.generateMonth(value);
                    return $filter("date")(value, $scope.dateFormat);
                } else if (value) {
                    throw "Model format is wrong, only timestamp or javascript date object are supported";
                } else {
                    //has to be a date for now
                    $scope.generateMonth($scope.standardDate);
                    return $scope.emptyString;
                }
            });

            $scope.opened = false;
            $scope.daySelectionOpened = false;

            var defaultMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "Settember", "October", "November", "December"];
            var defaultDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
            var defaultCleanName = "Clean";
            var defaultSelectName = "Select";
            var defaultDateFormat = "dd/MM/yyyy";
            var defaultEmptyString = "---";
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
                $scope.emptyString = $scope.options.emptyString || defaultEmptyString;
            } else {
                $scope.monthNames = defaultMonths;
                $scope.dayNames = defaultDays;
                $scope.cleanName = defaultCleanName;
                $scope.selectName = defaultSelectName;
                $scope.dateFormat = defaultDateFormat;
                $scope.times = defaultTimes;
                $scope.timepicker = defaultTimepicker;
                $scope.emptyString = defaultEmptyString;
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
                    label: padFilter(tmpDate.getUTCHours()) + ":" + padFilter(tmpDate.getUTCMinutes()) + ":" + padFilter(tmpDate.getUTCSeconds())
                };
                $scope.generatedTimes.push(tmpObj);

                var selectedDate = new Date(ngModel.$modelValue);

                if (selectedDate && selectedDate.getHours() == tmpObj.hour && selectedDate.getMinutes() == tmpObj.minute && selectedDate.getSeconds() == tmpObj.second) {
                    $scope.selectedTime = tmpObj;
                }
            }

            $scope.closeWrapper = function () {
                $scope.opened = false;
                $scope.daySelectionOpened = true;
                $scope.yearSelectionOpened = false;
            };


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
                        isSelectedDate: selectedDate && tmpDay.getTime() === selectedDate.getTime(),
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

                for (var num = $scope.month.selectedDate.getUTCFullYear() - 2; num <= $scope.month.selectedDate.getUTCFullYear() + 1; num++) {
                    var months = [];
                    for (var i = 0; i < 12; i++) {
                        months.push({
                            num: i,
                            isActualMonth: today.getUTCMonth() === i && today.getUTCFullYear() === num,
                            isSelectedMonth: selectedDate && selectedDate.getUTCMonth() === i && selectedDate.getUTCFullYear() === num
                        });
                    }
                    $scope.years.push({
                        num: num,
                        months: months
                    });
                }

            };


            if (!$scope.standardDate) {
                $scope.standardDate = new Date();
            }


            $scope.selectDay = function (date) {
                // $scope.modelDate = date;
                $scope.generateMonth(angular.copy(date));
                !$scope.timepicker && $scope.close(date);
                $scope.selectedDate = date;
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

            $scope.selectYear = function (year, month) {
                $scope.toggleYearSelection();
                var newDate = angular.copy($scope.month.selectedDate);
                newDate.setUTCFullYear(year);
                newDate.setUTCMonth(month);
                $scope.generateMonth(newDate);
            };

            $scope.toggleYearSelection = function () {
                $scope.yearSelectionOpened = !$scope.yearSelectionOpened;
                $scope.daySelectionOpened = !$scope.daySelectionOpened;
            };


            $scope.precYears = function () {
                var newDate = angular.copy($scope.month.selectedDate);
                newDate.setUTCFullYear(newDate.getUTCFullYear() - 3);
                $scope.generateMonth(newDate);
            };

            $scope.succYears = function () {
                var newDate = angular.copy($scope.month.selectedDate);
                newDate.setUTCFullYear(newDate.getUTCFullYear() + 3);
                $scope.generateMonth(newDate);
            };

            $scope.clear = function () {

                ngModel.$setViewValue(null);
                ngModel.$render();
                // $scope.modelDate = null;
                $scope.opened = false;
                $scope.generateMonth($scope.standardDate);
            };

            $scope.changeTime = function (time) {
                $scope.selectedTime = time;
            };

            $scope.close = function (date) {
                console.log(date);
                $scope.opened = false;
                if($scope.timepicker){
                    date.setHours($scope.selectedTime.hour);
                    date.setMinutes($scope.selectedTime.minute);
                    date.setSeconds($scope.selectedTime.second);
                }
                ngModel.$setViewValue($filter("date")(date, $scope.dateFormat));
                ngModel.$render();
                $timeout(function () {
                    $scope.events.onDaySelected && $scope.events.onDaySelected();
                });
            };
        },
        template: '<div class="datepicker"><div class="datepicker-wrapper" data-ng-show="opened" data-ng-click="closeWrapper()"></div><div class="datepicker-close" data-ng-show="opened" data-ng-click="closeWrapper()"><button type="button"></button></div><div class="datepicker-table-wrapper table" data-ng-show="daySelectionOpened && opened"><table class="day-table"><thead><tr class="month-header"><th style="width: 15%"><a data-ng-click="subMonth(month.selectedDate)">{{getPreviousMonthName()}}</a></th><th style="width: 70%" colspan="5"> {{monthNames[month.selectedDate.getMonth()]}} <a data-ng-click="toggleYearSelection($event)" class="button-month" type="button"> {{month.selectedDate.getFullYear()}}</a></th><th style="width: 15%"><a data-ng-click="addMonth(month.selectedDate)">{{getSuccessiveMonthName()}}</a></th></tr><tr><th data-ng-repeat="d in dayNames">{{d | substring}}</th></tr></thead><tbody><tr data-ng-repeat="week in month.weeks"><td class="focus" data-ng-click="!day.isDisabled && selectDay(day.date)" data-ng-repeat="day in week" data-ng-class="{\'disabled\': day.isDisabled,\'selected-date\': day.isSelectedDate, \'today\': day.isToday, \'different-month\': !day.isDisabled && day.differentMonth}"><a>{{day.number}}</a></td></tr><tr><td colspan="3"><select class="timeselect" data-ng-if="timepicker" data-ng-disabled="!selectedDate" data-ng-model="selectedTime" ng-options="t.label for t in generatedTimes" ng-change="changeTime(selectedTime)"></select></td><td colspan="4"><button type="button" style="margin-left: 5px" class="datepicker-button-clear" data-ng-if="timepicker" data-ng-disabled="!selectedTime" data-ng-click="close(selectedDate)">Select</button><button type="button" class="datepicker-button-clear" data-ng-click="clear()">{{cleanName}}</button></td></tr></tbody></table></div><div class="datepicker-table-wrapper table" data-ng-show="yearSelectionOpened && opened"><table class="year-table"><thead><tr class="month-header"><th style="width: 25%"><a data-ng-click="precYears()">prev</a></th><th style="width: 50%" colspan="3">{{years[0].num}}-{{years[years.length - 1].num}}</th><th style="width: 25%"><a data-ng-click="succYears()">next</a></th></tr></thead><tbody><tr data-ng-repeat="y in years"><td>{{y.num}}</td><td colspan="4"><table class="month-in-year-selection"><tr><td class="focus" data-ng-repeat="m in y.months | limitTo: 6" data-ng-click="selectYear(y.num, m.num)" data-ng-class="{\'selected-date\': m.isSelectedMonth, \'today\': m.isActualMonth}">{{monthNames[m.num] | substring}}</td></tr><tr><td class="focus" data-ng-repeat="m in y.months | limitTo: 12 : 6" data-ng-click="selectYear(y.num, m.num)" data-ng-class="{\'selected-date\': m.isSelectedMonth, \'today\': m.isActualMonth}">{{monthNames[m.num] | substring}}</td></tr></table></td></tr><tr></tr></tbody></table></div></div>'
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

import { Duration, Stack } from '../../core';
import {
  Alarm,
  AlarmWidget,
  Color,
  CustomWidget,
  GaugeWidget,
  GraphWidget,
  GraphWidgetView,
  LegendPosition,
  LogQueryLanguage,
  LogQueryVisualizationType,
  LogQueryWidget,
  Metric,
  Shading,
  SingleValueWidget,
  TableLayout,
  TableSummaryColumn,
  TableThreshold,
  TableWidget,
  VerticalShading,
} from '../lib';

describe('Graphs', () => {
  test('add stacked property to graphs', () => {
    // WHEN
    const stack = new Stack();
    const widget = new GraphWidget({
      title: 'Test widget',
      stacked: true,
      accountId: '123456789012',
    });

    // THEN
    expect(stack.resolve(widget.toJson())).toEqual([{
      type: 'metric',
      width: 6,
      height: 6,
      properties: {
        view: 'timeSeries',
        title: 'Test widget',
        region: { Ref: 'AWS::Region' },
        stacked: true,
        yAxis: {},
        accountId: '123456789012',
      },
    }]);
  });

  test('add metrics to graphs on either axis', () => {
    // WHEN
    const stack = new Stack();
    const widget = new GraphWidget({
      title: 'My fancy graph',
      left: [
        new Metric({ namespace: 'CDK', metricName: 'Test' }),
      ],
      right: [
        new Metric({ namespace: 'CDK', metricName: 'Tast' }),
      ],
    });

    // THEN
    expect(stack.resolve(widget.toJson())).toEqual([{
      type: 'metric',
      width: 6,
      height: 6,
      properties: {
        view: 'timeSeries',
        title: 'My fancy graph',
        region: { Ref: 'AWS::Region' },
        metrics: [
          ['CDK', 'Test'],
          ['CDK', 'Tast', { yAxis: 'right' }],
        ],
        yAxis: {},
      },
    }]);
  });

  test('add metrics to graphs on either axis lazily', () => {
    // WHEN
    const stack = new Stack();
    const widget = new GraphWidget({
      title: 'My fancy graph',
    });
    widget.addLeftMetric(new Metric({ namespace: 'CDK', metricName: 'Test' }));
    widget.addRightMetric(new Metric({ namespace: 'CDK', metricName: 'Tast' }));

    // THEN
    expect(stack.resolve(widget.toJson())).toEqual([{
      type: 'metric',
      width: 6,
      height: 6,
      properties: {
        view: 'timeSeries',
        title: 'My fancy graph',
        region: { Ref: 'AWS::Region' },
        metrics: [
          ['CDK', 'Test'],
          ['CDK', 'Tast', { yAxis: 'right' }],
        ],
        yAxis: {},
      },
    }]);
  });

  test('label, color, id and visible are respected in constructor', () => {
    // WHEN
    const stack = new Stack();
    const widget = new GraphWidget({
      left: [new Metric({ namespace: 'CDK', metricName: 'Test', label: 'MyMetric', color: '000000', id: 'custom_id', visible: false })],
    });

    // THEN
    expect(stack.resolve(widget.toJson())).toEqual([{
      type: 'metric',
      width: 6,
      height: 6,
      properties: {
        view: 'timeSeries',
        region: { Ref: 'AWS::Region' },
        metrics: [
          ['CDK', 'Test', { label: 'MyMetric', color: '000000', id: 'custom_id', visible: false }],
        ],
        yAxis: {},
      },
    }]);
  });

  test('bar view', () => {
    // WHEN
    const stack = new Stack();
    const widget = new GraphWidget({
      title: 'Test widget',
      view: GraphWidgetView.BAR,
    });

    // THEN
    expect(stack.resolve(widget.toJson())).toEqual([{
      type: 'metric',
      width: 6,
      height: 6,
      properties: {
        view: 'bar',
        title: 'Test widget',
        region: { Ref: 'AWS::Region' },
        yAxis: {},
      },
    }]);
  });

  test('singlevalue widget', () => {
    // GIVEN
    const stack = new Stack();
    const metric = new Metric({ namespace: 'CDK', metricName: 'Test' });

    // WHEN
    const widget = new SingleValueWidget({
      metrics: [metric],
      accountId: '123456789012',
    });

    // THEN
    expect(stack.resolve(widget.toJson())).toEqual([{
      type: 'metric',
      width: 6,
      height: 3,
      properties: {
        view: 'singleValue',
        region: { Ref: 'AWS::Region' },
        metrics: [
          ['CDK', 'Test'],
        ],
        accountId: '123456789012',
      },
    }]);
  });

  test('query result widget', () => {
    // GIVEN
    const stack = new Stack();
    const logGroup = { logGroupName: 'my-log-group' };

    // WHEN
    const widget = new LogQueryWidget({
      logGroupNames: [logGroup.logGroupName],
      queryLines: [
        'fields @message',
        'filter @message like /Error/',
      ],
    });

    // THEN
    expect(stack.resolve(widget.toJson())).toEqual([{
      type: 'log',
      width: 6,
      height: 6,
      properties: {
        view: 'table',
        region: { Ref: 'AWS::Region' },
        query: `SOURCE '${logGroup.logGroupName}' | fields @message\n| filter @message like /Error/`,
      },
    }]);
  });

  test('query result widget - bar', () => {
    // GIVEN
    const stack = new Stack();
    const logGroup = { logGroupName: 'my-log-group' };

    // WHEN
    const widget = new LogQueryWidget({
      logGroupNames: [logGroup.logGroupName],
      view: LogQueryVisualizationType.BAR,
      queryLines: [
        'fields @message',
        'filter @message like /Error/',
      ],
      accountId: '123456789012',
    });

    // THEN
    expect(stack.resolve(widget.toJson())).toEqual([{
      type: 'log',
      width: 6,
      height: 6,
      properties: {
        view: 'bar',
        region: { Ref: 'AWS::Region' },
        query: `SOURCE '${logGroup.logGroupName}' | fields @message\n| filter @message like /Error/`,
        accountId: '123456789012',
      },
    }]);
  });

  test('query result widget - pie', () => {
    // GIVEN
    const stack = new Stack();
    const logGroup = { logGroupName: 'my-log-group' };

    // WHEN
    const widget = new LogQueryWidget({
      logGroupNames: [logGroup.logGroupName],
      view: LogQueryVisualizationType.PIE,
      queryLines: [
        'fields @message',
        'filter @message like /Error/',
      ],
    });

    // THEN
    expect(stack.resolve(widget.toJson())).toEqual([{
      type: 'log',
      width: 6,
      height: 6,
      properties: {
        view: 'pie',
        region: { Ref: 'AWS::Region' },
        query: `SOURCE '${logGroup.logGroupName}' | fields @message\n| filter @message like /Error/`,
      },
    }]);
  });

  test('query result widget - line', () => {
    // GIVEN
    const stack = new Stack();
    const logGroup = { logGroupName: 'my-log-group' } ;

    // WHEN
    const widget = new LogQueryWidget({
      logGroupNames: [logGroup.logGroupName],
      view: LogQueryVisualizationType.LINE,
      queryLines: [
        'fields @message',
        'filter @message like /Error/',
      ],
    });

    // THEN
    expect(stack.resolve(widget.toJson())).toEqual([{
      type: 'log',
      width: 6,
      height: 6,
      properties: {
        view: 'timeSeries',
        stacked: false,
        region: { Ref: 'AWS::Region' },
        query: `SOURCE '${logGroup.logGroupName}' | fields @message\n| filter @message like /Error/`,
      },
    }]);
  });

  test('query result widget - stackedarea', () => {
    // GIVEN
    const stack = new Stack();
    const logGroup = { logGroupName: 'my-log-group' };

    // WHEN
    const widget = new LogQueryWidget({
      logGroupNames: [logGroup.logGroupName],
      view: LogQueryVisualizationType.STACKEDAREA,
      queryLines: [
        'fields @message',
        'filter @message like /Error/',
      ],
    });

    // THEN
    expect(stack.resolve(widget.toJson())).toEqual([{
      type: 'log',
      width: 6,
      height: 6,
      properties: {
        view: 'timeSeries',
        stacked: true,
        region: { Ref: 'AWS::Region' },
        query: `SOURCE '${logGroup.logGroupName}' | fields @message\n| filter @message like /Error/`,
      },
    }]);
  });

  test('query result widget - sql', () => {
    // GIVEN
    const stack = new Stack();
    const logGroup = { logGroupName: 'my-log-group' };

    // WHEN
    const widget = new LogQueryWidget({
      logGroupNames: [logGroup.logGroupName],
      view: LogQueryVisualizationType.STACKEDAREA,
      queryString: "SELECT count(*) as count FROM 'my-log-group'",
      queryLanguage: LogQueryLanguage.SQL,
    });

    // THEN
    expect(stack.resolve(widget.toJson())).toEqual([{
      type: 'log',
      width: 6,
      height: 6,
      properties: {
        view: 'timeSeries',
        stacked: true,
        region: { Ref: 'AWS::Region' },
        query: "SOURCE 'my-log-group' | SELECT count(*) as count FROM 'my-log-group'",
        queryLanguage: 'SQL',
      },
    }]);
  });

  test('query result widget - ppl', () => {
    // GIVEN
    const stack = new Stack();
    const logGroup = { logGroupName: 'my-log-group' };

    // WHEN
    const widget = new LogQueryWidget({
      logGroupNames: [logGroup.logGroupName],
      view: LogQueryVisualizationType.STACKEDAREA,
      queryString: 'fields `@message`\ | sort - `@timestamp`',
      queryLanguage: LogQueryLanguage.PPL,
    });

    // THEN
    expect(stack.resolve(widget.toJson())).toEqual([{
      type: 'log',
      width: 6,
      height: 6,
      properties: {
        view: 'timeSeries',
        stacked: true,
        region: { Ref: 'AWS::Region' },
        query: "SOURCE 'my-log-group' | fields `@message`\ | sort - `@timestamp`",
        queryLanguage: 'PPL',
      },
    }]);
  });

  test('alarm widget', () => {
    // GIVEN
    const stack = new Stack();

    const alarm = new Metric({ namespace: 'CDK', metricName: 'Test' }).createAlarm(stack, 'Alarm', {
      evaluationPeriods: 2,
      threshold: 1000,
    });

    // WHEN
    const widget = new AlarmWidget({
      alarm,
      accountId: '123456789012',
    });

    // THEN
    expect(stack.resolve(widget.toJson())).toEqual([{
      type: 'metric',
      width: 6,
      height: 6,
      properties: {
        view: 'timeSeries',
        region: { Ref: 'AWS::Region' },
        annotations: {
          alarms: [{ 'Fn::GetAtt': ['Alarm7103F465', 'Arn'] }],
        },
        yAxis: {},
        accountId: '123456789012',
      },
    }]);
  });

  test('custom widget basic', () => {
    // GIVEN
    const stack = new Stack();

    // WHEN
    const widget = new CustomWidget({
      functionArn: 'arn:aws:lambda:us-east-1:123456789:function:customwidgetfunction',
      title: 'CustomWidget',
    });

    // THEN
    expect(stack.resolve(widget.toJson())).toEqual([{
      type: 'custom',
      width: 6,
      height: 6,
      properties: {
        title: 'CustomWidget',
        endpoint: 'arn:aws:lambda:us-east-1:123456789:function:customwidgetfunction',
        updateOn: {
          refresh: true,
          resize: true,
          timeRange: true,
        },
      },
    }]);
  });

  test('custom widget full config', () => {
    // GIVEN
    const stack = new Stack();

    // WHEN
    const widget = new CustomWidget({
      functionArn: 'arn:aws:lambda:us-east-1:123456789:function:customwidgetfunction',
      title: 'CustomWidget',
      height: 1,
      width: 1,
      params: {
        any: 'param',
      },
      updateOnRefresh: false,
      updateOnResize: false,
      updateOnTimeRangeChange: false,
    });

    // THEN
    expect(stack.resolve(widget.toJson())).toEqual([{
      type: 'custom',
      width: 1,
      height: 1,
      properties: {
        title: 'CustomWidget',
        endpoint: 'arn:aws:lambda:us-east-1:123456789:function:customwidgetfunction',
        params: {
          any: 'param',
        },
        updateOn: {
          refresh: false,
          resize: false,
          timeRange: false,
        },
      },
    }]);
  });

  test('add horizontal annotations to graph', () => {
    // WHEN
    const stack = new Stack();
    const widget = new GraphWidget({
      title: 'My fancy graph',
      left: [
        new Metric({ namespace: 'CDK', metricName: 'Test' }),
      ],
      leftAnnotations: [{
        value: 1000,
        color: '667788',
        fill: Shading.BELOW,
        label: 'this is the annotation',
      }],
    });

    // THEN
    expect(stack.resolve(widget.toJson())).toEqual([{
      type: 'metric',
      width: 6,
      height: 6,
      properties: {
        view: 'timeSeries',
        title: 'My fancy graph',
        region: { Ref: 'AWS::Region' },
        metrics: [
          ['CDK', 'Test'],
        ],
        annotations: {
          horizontal: [{
            yAxis: 'left',
            value: 1000,
            color: '667788',
            fill: 'below',
            label: 'this is the annotation',
          }],
        },
        yAxis: {},
      },
    }]);
  });

  test('add vertical annotations to graph', () => {
    // WHEN
    const stack = new Stack();
    const widget = new GraphWidget({
      title: 'My fancy graph',
      left: [
        new Metric({ namespace: 'CDK', metricName: 'Test' }),
      ],
      verticalAnnotations: [{
        date: '2021-07-29T02:31:09.890Z',
        color: '667788',
        fill: VerticalShading.AFTER,
        label: 'this is the annotation',
      }],
    });

    // THEN
    expect(stack.resolve(widget.toJson())).toEqual([{
      type: 'metric',
      width: 6,
      height: 6,
      properties: {
        view: 'timeSeries',
        title: 'My fancy graph',
        region: { Ref: 'AWS::Region' },
        metrics: [
          ['CDK', 'Test'],
        ],
        annotations: {
          vertical: [{
            value: '2021-07-29T02:31:09.890Z',
            color: '667788',
            fill: 'after',
            label: 'this is the annotation',
          }],
        },
        yAxis: {},
      },
    }]);
  });

  test('vertical annotation date must match ISO 8601', () => {
    // WHEN
    expect(() => {
      new GraphWidget({
        title: 'My fancy graph',
        left: [
          new Metric({ namespace: 'CDK', metricName: 'Test' }),
        ],
        verticalAnnotations: [{
          date: '2021-07-29T02:31:09.890ZZ',
          color: '667788',
          fill: VerticalShading.AFTER,
          label: 'this is the annotation',
        }],
      });
    }).toThrow();
  });

  test('convert alarm to annotation', () => {
    // GIVEN
    const stack = new Stack();

    const metric = new Metric({ namespace: 'CDK', metricName: 'Test' });

    const alarm = metric.createAlarm(stack, 'Alarm', {
      evaluationPeriods: 7,
      datapointsToAlarm: 2,
      threshold: 1000,
    });

    // WHEN
    const widget = new GraphWidget({
      right: [metric],
      rightAnnotations: [alarm.toAnnotation()],
    });

    // THEN
    expect(stack.resolve(widget.toJson())).toEqual([{
      type: 'metric',
      width: 6,
      height: 6,
      properties: {
        view: 'timeSeries',
        region: { Ref: 'AWS::Region' },
        metrics: [
          ['CDK', 'Test', { yAxis: 'right' }],
        ],
        annotations: {
          horizontal: [{
            yAxis: 'right',
            value: 1000,
            label: 'Test >= 1000 for 2 datapoints within 35 minutes',
          }],
        },
        yAxis: {},
      },
    }]);
  });

  test('add yAxis to graph', () => {
    // WHEN
    const stack = new Stack();
    const widget = new GraphWidget({
      title: 'My fancy graph',
      left: [
        new Metric({ namespace: 'CDK', metricName: 'Test' }),
      ],
      right: [
        new Metric({ namespace: 'CDK', metricName: 'Tast' }),
      ],
      leftYAxis: ({
        label: 'Left yAxis',
        max: 100,
      }),
      rightYAxis: ({
        label: 'Right yAxis',
        min: 10,
        showUnits: false,
      }),
    });

    // THEN
    expect(stack.resolve(widget.toJson())).toEqual([{
      type: 'metric',
      width: 6,
      height: 6,
      properties: {
        view: 'timeSeries',
        title: 'My fancy graph',
        region: { Ref: 'AWS::Region' },
        metrics: [
          ['CDK', 'Test'],
          ['CDK', 'Tast', { yAxis: 'right' }],
        ],
        yAxis: {
          left: { label: 'Left yAxis', max: 100 },
          right: { label: 'Right yAxis', min: 10, showUnits: false },
        },
      },
    }]);
  });

  test('specify liveData property on graph', () => {
    // WHEN
    const stack = new Stack();
    const widget = new GraphWidget({
      title: 'My live graph',
      left: [
        new Metric({ namespace: 'CDK', metricName: 'Test' }),
      ],
      liveData: true,
    });

    // THEN
    expect(stack.resolve(widget.toJson())).toEqual([{
      type: 'metric',
      width: 6,
      height: 6,
      properties: {
        view: 'timeSeries',
        title: 'My live graph',
        region: { Ref: 'AWS::Region' },
        metrics: [
          ['CDK', 'Test'],
        ],
        liveData: true,
        yAxis: {},
      },
    }]);
  });

  test('can use imported alarm with graph', () => {
    // GIVEN
    const stack = new Stack();
    const alarm = Alarm.fromAlarmArn(stack, 'Alarm', 'arn:aws:cloudwatch:region:account-id:alarm:alarm-name');

    // WHEN
    new AlarmWidget({
      title: 'My fancy graph',
      alarm,
    });

    // THEN: Compiles
  });

  test('add setPeriodToTimeRange to singleValueWidget', () => {
    // GIVEN
    const stack = new Stack();
    const metric = new Metric({ namespace: 'CDK', metricName: 'Test' });

    // WHEN
    const widget = new SingleValueWidget({
      metrics: [metric],
      setPeriodToTimeRange: true,
    });

    // THEN
    expect(stack.resolve(widget.toJson())).toEqual([{
      type: 'metric',
      width: 6,
      height: 3,
      properties: {
        view: 'singleValue',
        region: { Ref: 'AWS::Region' },
        metrics: [
          ['CDK', 'Test'],
        ],
        setPeriodToTimeRange: true,
      },
    }]);
  });

  test('add sparkline to singleValueWidget', () => {
    // GIVEN
    const stack = new Stack();
    const metric = new Metric({ namespace: 'CDK', metricName: 'Test' });

    // WHEN
    const widget = new SingleValueWidget({
      metrics: [metric],
      sparkline: true,
    });

    // THEN
    expect(stack.resolve(widget.toJson())).toEqual([{
      type: 'metric',
      width: 6,
      height: 3,
      properties: {
        view: 'singleValue',
        region: { Ref: 'AWS::Region' },
        metrics: [
          ['CDK', 'Test'],
        ],
        sparkline: true,
      },
    }]);
  });

  test('throws if setPeriodToTimeRange and sparkline is set on singleValueWidget', () => {
    // GIVEN
    new Stack();
    const metric = new Metric({ namespace: 'CDK', metricName: 'Test' });

    // WHEN
    const toThrow = () => {
      new SingleValueWidget({
        metrics: [metric],
        setPeriodToTimeRange: true,
        sparkline: true,
      });
    };

    // THEN
    expect(() => toThrow()).toThrow(/You cannot use setPeriodToTimeRange with sparkline/);
  });

  test('add singleValueFullPrecision to singleValueWidget', () => {
    // GIVEN
    const stack = new Stack();
    const metric = new Metric({ namespace: 'CDK', metricName: 'Test' });

    // WHEN
    const widget = new SingleValueWidget({
      metrics: [metric],
      fullPrecision: true,
    });

    // THEN
    expect(stack.resolve(widget.toJson())).toEqual([{
      type: 'metric',
      width: 6,
      height: 3,
      properties: {
        view: 'singleValue',
        region: { Ref: 'AWS::Region' },
        metrics: [
          ['CDK', 'Test'],
        ],
        singleValueFullPrecision: true,
      },
    }]);
  });

  test('add period to singleValueWidget', () => {
    // GIVEN
    const stack = new Stack();
    const metric = new Metric({ namespace: 'CDK', metricName: 'Test' });

    // WHEN
    const widget = new SingleValueWidget({
      metrics: [metric],
      period: Duration.days(2),
    });

    // THEN
    expect(stack.resolve(widget.toJson())).toEqual([{
      type: 'metric',
      width: 6,
      height: 3,
      properties: {
        view: 'singleValue',
        region: { Ref: 'AWS::Region' },
        metrics: [
          ['CDK', 'Test'],
        ],
        period: 172800,
      },
    }]);
  });

  test('allows overriding custom values of dashboard widgets', () => {
    class HiddenMetric extends Metric {
      public toMetricConfig() {
        const ret = super.toMetricConfig();
        // @ts-ignore
        ret.renderingProperties.visible = false;
        return ret;
      }
    }

    const stack = new Stack();
    const widget = new GraphWidget({
      left: [
        new HiddenMetric({ namespace: 'CDK', metricName: 'Test' }),
      ],
    });

    expect(stack.resolve(widget.toJson())[0].properties.metrics[0])
      .toEqual(['CDK', 'Test', { visible: false }]);
  });

  test('GraphColor is correctly converted into the correct hexcode', () => {
    // GIVEN
    const stack = new Stack();
    const metric = new Metric({ namespace: 'CDK', metricName: 'Test' });

    // WHEN
    const widget = new GraphWidget({
      left: [metric.with({
        color: Color.BLUE,
      })],
      leftAnnotations: [
        { color: Color.RED, value: 100 },
      ],
    });

    expect(stack.resolve(widget.toJson())[0].properties.metrics[0]).toEqual(['CDK', 'Test', { color: '#1f77b4' }]);
    expect(stack.resolve(widget.toJson())[0].properties.annotations.horizontal[0]).toEqual({ yAxis: 'left', value: 100, color: '#d62728' });
  });

  test('legend position is respected in constructor', () => {
    // WHEN
    const stack = new Stack();
    const widget = new GraphWidget({
      left: [new Metric({ namespace: 'CDK', metricName: 'Test' })],
      legendPosition: LegendPosition.RIGHT,
    });

    // THEN
    expect(stack.resolve(widget.toJson())).toEqual([{
      type: 'metric',
      width: 6,
      height: 6,
      properties: {
        view: 'timeSeries',
        region: { Ref: 'AWS::Region' },
        metrics: [
          ['CDK', 'Test'],
        ],
        yAxis: {},
        legend: {
          position: 'right',
        },
      },
    }]);
  });

  test('add setPeriodToTimeRange to GraphWidget', () => {
    // GIVEN
    const stack = new Stack();
    const widget = new GraphWidget({
      left: [new Metric({ namespace: 'CDK', metricName: 'Test' })],
      view: GraphWidgetView.PIE,
      setPeriodToTimeRange: true,
    });

    // THEN
    expect(stack.resolve(widget.toJson())).toEqual([{
      type: 'metric',
      width: 6,
      height: 6,
      properties: {
        view: 'pie',
        region: { Ref: 'AWS::Region' },
        metrics: [
          ['CDK', 'Test'],
        ],
        yAxis: {},
        setPeriodToTimeRange: true,
      },
    }]);
  });

  test('add GaugeWidget', () => {
    // GIVEN
    const stack = new Stack();
    const widget = new GaugeWidget({
      metrics: [new Metric({ namespace: 'CDK', metricName: 'Test' })],
      accountId: '123456789012',
    });

    // THEN
    expect(stack.resolve(widget.toJson())).toEqual([{
      type: 'metric',
      width: 6,
      height: 6,
      properties: {
        view: 'gauge',
        region: { Ref: 'AWS::Region' },
        metrics: [
          ['CDK', 'Test'],
        ],
        yAxis: {
          left: {
            min: 0,
            max: 100,
          },
        },
        accountId: '123456789012',
      },
    }]);
  });

  test('GraphWidget supports stat and period', () => {
    // GIVEN
    const stack = new Stack();
    const widget = new GraphWidget({
      left: [new Metric({ namespace: 'CDK', metricName: 'Test' })],
      statistic: 'Average',
      period: Duration.days(2),
    });

    // THEN
    expect(stack.resolve(widget.toJson())).toEqual([{
      type: 'metric',
      width: 6,
      height: 6,
      properties: {
        view: 'timeSeries',
        region: { Ref: 'AWS::Region' },
        metrics: [
          ['CDK', 'Test'],
        ],
        yAxis: {},
        stat: 'Average',
        period: 172800,
      },
    }]);
  });

  test('add start and end properties to GraphWidget', () => {
    // GIVEN
    const stack = new Stack();
    const widget = new GraphWidget({
      left: [new Metric({ namespace: 'CDK', metricName: 'Test' })],
      view: GraphWidgetView.PIE,
      start: '-P7D',
      end: '2018-12-17T06:00:00.000Z',
    });

    // THEN
    expect(stack.resolve(widget.toJson())).toEqual([{
      type: 'metric',
      width: 6,
      height: 6,
      properties: {
        view: 'pie',
        region: { Ref: 'AWS::Region' },
        metrics: [
          ['CDK', 'Test'],
        ],
        yAxis: {},
        start: '-P7D',
        end: '2018-12-17T06:00:00.000Z',
      },
    }]);
  });

  test('add start and end properties to SingleValueWidget', () => {
    // GIVEN
    const stack = new Stack();
    const widget = new SingleValueWidget({
      metrics: [new Metric({ namespace: 'CDK', metricName: 'Test' })],
      start: '-P7D',
      end: '2018-12-17T06:00:00.000Z',
    });

    // THEN
    expect(stack.resolve(widget.toJson())).toEqual([{
      type: 'metric',
      width: 6,
      height: 3,
      properties: {
        view: 'singleValue',
        region: { Ref: 'AWS::Region' },
        metrics: [
          ['CDK', 'Test'],
        ],
        start: '-P7D',
        end: '2018-12-17T06:00:00.000Z',
      },
    }]);
  });

  test('add start and end properties to GaugeWidget', () => {
    // GIVEN
    const stack = new Stack();
    const widget = new GaugeWidget({
      metrics: [new Metric({ namespace: 'CDK', metricName: 'Test' })],
      start: '-P7D',
      end: '2018-12-17T06:00:00.000Z',
    });

    // THEN
    expect(stack.resolve(widget.toJson())).toEqual([{
      type: 'metric',
      width: 6,
      height: 6,
      properties: {
        view: 'gauge',
        region: { Ref: 'AWS::Region' },
        metrics: [
          ['CDK', 'Test'],
        ],
        yAxis: {
          left: {
            min: 0,
            max: 100,
          },
        },
        start: '-P7D',
        end: '2018-12-17T06:00:00.000Z',
      },
    }]);
  });

  test('cannot specify an end without a start in GraphWidget', () => {
    // GIVEN
    const stack = new Stack();

    // THEN
    expect(() => {
      new GraphWidget({
        left: [new Metric({ namespace: 'CDK', metricName: 'Test' })],
        view: GraphWidgetView.PIE,
        end: '2018-12-17T06:00:00.000Z',
      });
    }).toThrow(/If you specify a value for end, you must also specify a value for start./);
  });

  test('cannot specify an end without a start in SingleValueWidget', () => {
    // GIVEN
    const stack = new Stack();

    // THEN
    expect(() => {
      new SingleValueWidget({
        metrics: [new Metric({ namespace: 'CDK', metricName: 'Test' })],
        end: '2018-12-17T06:00:00.000Z',
      });
    }).toThrow(/If you specify a value for end, you must also specify a value for start./);
  });

  test('cannot specify an end without a start in GaugeWidget', () => {
    // GIVEN
    const stack = new Stack();

    // THEN
    expect(() => {
      new GaugeWidget({
        metrics: [new Metric({ namespace: 'CDK', metricName: 'Test' })],
        end: '2018-12-17T06:00:00.000Z',
      });
    }).toThrow(/If you specify a value for end, you must also specify a value for start./);
  });

  test('add annotations to gauge widget', () => {
    // GIVEN
    const stack = new Stack();
    const widget = new GaugeWidget({
      metrics: [new Metric({ namespace: 'CDK', metricName: 'Test' })],
      annotations: [
        {
          color: '#b2df8d',
          label: 'Up',
          value: 1,
          fill: Shading.ABOVE,
        },
      ],
    });

    // THEN
    expect(stack.resolve(widget.toJson())).toEqual([{
      type: 'metric',
      width: 6,
      height: 6,
      properties: {
        view: 'gauge',
        region: { Ref: 'AWS::Region' },
        metrics: [
          ['CDK', 'Test'],
        ],
        yAxis: {
          left: {
            min: 0,
            max: 100,
          },
        },
        annotations: {
          horizontal: [
            {
              color: '#b2df8d',
              label: 'Up',
              value: 1,
              fill: 'above',
            },
          ],
        },
      },
    }]);
  });

  describe('TableWidget', () => {
    let stack;
    let metric;

    beforeEach(() => {
      stack = new Stack();
      metric = new Metric({ namespace: 'CDK', metricName: 'Test' });
    });

    test('with optional fields unset', () => {
      // GIVEN
      const widget = new TableWidget({
        metrics: [metric],
      });

      // THEN
      expect(stack.resolve(widget.toJson())).toEqual([{
        type: 'metric',
        height: 6,
        width: 6,
        properties: {
          view: 'table',
          metrics: [
            ['CDK', 'Test'],
          ],
          region: { Ref: 'AWS::Region' },
          table: {
            layout: 'horizontal',
            showTimeSeriesData: true,
            stickySummary: false,
            summaryColumns: [],
          },
          yAxis: {},
        },
      }]);
    });

    test('add metrics lazily', () => {
      // GIVEN
      const widget = new TableWidget({});
      widget.addMetric(metric);

      // THEN
      expect(stack.resolve(widget.toJson())).toEqual([{
        type: 'metric',
        height: 6,
        width: 6,
        properties: {
          view: 'table',
          metrics: [
            ['CDK', 'Test'],
          ],
          region: { Ref: 'AWS::Region' },
          table: {
            layout: 'horizontal',
            showTimeSeriesData: true,
            stickySummary: false,
            summaryColumns: [],
          },
          yAxis: {},
        },
      }]);
    });

    test('with most table fields set', () => {
      // GIVEN
      const widget = new TableWidget({
        metrics: [metric],
        layout: TableLayout.VERTICAL,
        showUnitsInLabel: true,
        liveData: true,
        fullPrecision: true,
        summary: {
          columns: [TableSummaryColumn.AVERAGE],
          hideNonSummaryColumns: true,
          sticky: true,
        },
      });

      // THEN
      expect(stack.resolve(widget.toJson())).toEqual([{
        type: 'metric',
        height: 6,
        width: 6,
        properties: {
          view: 'table',
          metrics: [
            ['CDK', 'Test'],
          ],
          region: { Ref: 'AWS::Region' },
          liveData: true,
          singleValueFullPrecision: true,
          table: {
            layout: 'vertical',
            showTimeSeriesData: false,
            stickySummary: true,
            summaryColumns: ['AVG'],
          },
          yAxis: {
            left: {
              showUnits: true,
            },
          },
        },
      }]);
    });

    test('with thresholds', () => {
      // GIVEN
      const widget = new TableWidget({
        metrics: [metric],
        thresholds: [
          TableThreshold.above(1000, Color.RED),
          TableThreshold.between(500, 1000, Color.ORANGE),
          TableThreshold.below(500, Color.GREEN),
        ],
      });

      // THEN
      expect(stack.resolve(widget.toJson())).toEqual([{
        type: 'metric',
        height: 6,
        width: 6,
        properties: {
          view: 'table',
          metrics: [
            ['CDK', 'Test'],
          ],
          region: { Ref: 'AWS::Region' },
          table: {
            layout: 'horizontal',
            showTimeSeriesData: true,
            stickySummary: false,
            summaryColumns: [],
          },
          yAxis: {},
          annotations: {
            horizontal: [
              {
                color: '#d62728',
                fill: 'above',
                value: 1000,
              },
              [
                {
                  color: '#ff7f0e',
                  value: 500,
                },
                {
                  value: 1000,
                },
              ],
              {
                color: '#2ca02c',
                fill: 'below',
                value: 500,
              },
            ],
          },
        },
      }]);
    });

    test('with start and end set', () => {
      // GIVEN
      const widget = new TableWidget({
        metrics: [metric],
        start: '-P7D',
        end: '2018-12-17T06:00:00.000Z',
      });

      // THEN
      expect(stack.resolve(widget.toJson())).toEqual([{
        type: 'metric',
        height: 6,
        width: 6,
        properties: {
          view: 'table',
          metrics: [
            ['CDK', 'Test'],
          ],
          region: { Ref: 'AWS::Region' },
          table: {
            layout: 'horizontal',
            showTimeSeriesData: true,
            stickySummary: false,
            summaryColumns: [],
          },
          yAxis: {},
          start: '-P7D',
          end: '2018-12-17T06:00:00.000Z',
        },
      }]);
    });

    test('cannot specify an end without a start', () => {
      expect(() => {
        new TableWidget({
          metrics: [metric],
          end: '2018-12-17T06:00:00.000Z',
        });
      }).toThrow(/If you specify a value for end, you must also specify a value for start./);
    });
  });
});

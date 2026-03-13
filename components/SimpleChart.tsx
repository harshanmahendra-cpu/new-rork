import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';

interface BarChartProps {
  data: { label: string; value: number }[];
  height?: number;
  barColor?: string;
}

export function SimpleBarChart({ data, height = 150, barColor = Colors.primary }: BarChartProps) {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <View style={[styles.chartContainer, { height }]}>
      <View style={styles.barsContainer}>
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * (height - 30);
          return (
            <View key={index} style={styles.barWrapper}>
              <View style={styles.barColumn}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(barHeight, 4),
                      backgroundColor: barColor,
                    },
                  ]}
                />
              </View>
              <Text style={styles.barLabel} numberOfLines={1}>
                {item.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chartContainer: {
    width: '100%',
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    maxWidth: 50,
  },
  barColumn: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },
  bar: {
    width: '60%',
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    position: 'absolute',
    bottom: 0,
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

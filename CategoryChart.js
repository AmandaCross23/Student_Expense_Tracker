import React from "react";
import { View, Text, Dimensions} from "react-native-web";
import {BarChart} from "react-native-chart-kit";

export default function CategoryChart({ categoryTotals }) {
    const labels = Object.keys(categoryTotals);
    const values = Object.values(categoryTotals);

  if (labels.length === 0) {
    return <Text style={{ textAlign: "center", marginTop: 20 }}>No data</Text>;
  }

  return (
    <View style={{ marginVertical: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: "bold", textAlign: "center" }}>
        Spending by Category
      </Text>

      <BarChart
        data={{
          labels: labels,
          datasets: [{ data: values }],
        }}
        width={Dimensions.get("window").width - 20}
        height={220}
        yAxisLabel="$"
        chartConfig={{
          backgroundColor: "white",
          backgroundGradientFrom: "grey",
          backgroundGradientTo: "white",
          decimalPlaces: 2,
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          labelColor: () => "black",
        }}
        style={{
          borderRadius: 16,
        }}
      />
    </View>
  );    
}


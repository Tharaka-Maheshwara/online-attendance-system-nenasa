import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Generate a PDF report for attendance records
 * @param {Object} options - Report generation options
 * @param {string} options.title - Report title
 * @param {Array} options.attendanceData - Array of attendance records
 * @param {Object} options.filters - Applied filters (date, dateRange, class, etc.)
 * @param {Object} options.statistics - Summary statistics
 * @param {string} options.fileName - Output file name
 */
export const generateAttendanceReport = (options) => {
  const {
    title,
    attendanceData,
    filters,
    statistics,
    fileName = "attendance_report.pdf",
  } = options;

  // Create new PDF document
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Add header with logo/title
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(41, 128, 185); // Blue color
  doc.text("Nenasa Online Attendance System", pageWidth / 2, yPosition, {
    align: "center",
  });

  yPosition += 10;
  doc.setFontSize(16);
  doc.setTextColor(52, 73, 94); // Dark gray
  doc.text(title, pageWidth / 2, yPosition, { align: "center" });

  yPosition += 15;

  // Add filters information
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);

  if (filters) {
    if (filters.date) {
      doc.text(`Date: ${formatDate(filters.date)}`, 14, yPosition);
      yPosition += 6;
    }

    if (filters.dateFrom && filters.dateTo) {
      doc.text(
        `Date Range: ${formatDate(filters.dateFrom)} - ${formatDate(
          filters.dateTo
        )}`,
        14,
        yPosition
      );
      yPosition += 6;
    }

    if (filters.grade) {
      doc.text(`Grade: ${filters.grade}`, 14, yPosition);
      yPosition += 6;
    }

    if (filters.subject) {
      doc.text(`Subject: ${filters.subject}`, 14, yPosition);
      yPosition += 6;
    }

    if (filters.className) {
      doc.text(`Class: ${filters.className}`, 14, yPosition);
      yPosition += 6;
    }
  }

  // Add generation timestamp
  doc.text(
    `Generated: ${new Date().toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}`,
    14,
    yPosition
  );
  yPosition += 10;

  // Add statistics summary if provided
  if (statistics) {
    addStatisticsSummary(doc, statistics, yPosition);
    yPosition += 25;
  }

  // Prepare table data
  const tableColumns = [
    "No.",
    "Student Name",
    "Register No.",
    "Class",
    "Date",
    "Status",
    "Time",
  ];

  const tableRows = attendanceData.map((record, index) => [
    index + 1,
    record.studentName || "N/A",
    record.registerNumber || "N/A",
    record.className || "N/A",
    formatDate(record.date),
    record.status ? record.status.toUpperCase() : "N/A",
    record.timestamp ? formatTime(record.timestamp) : "N/A",
  ]);

  // Add table to PDF
  autoTable(doc, {
    head: [tableColumns],
    body: tableRows,
    startY: yPosition,
    theme: "grid",
    headStyles: {
      fillColor: [52, 152, 219], // Blue header
      textColor: 255,
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245], // Light gray
    },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" }, // No.
      1: { cellWidth: 40 }, // Student Name
      2: { cellWidth: 25, halign: "center" }, // Register No.
      3: { cellWidth: 35 }, // Class
      4: { cellWidth: 25, halign: "center" }, // Date
      5: { cellWidth: 20, halign: "center" }, // Status
      6: { cellWidth: 23, halign: "center" }, // Time
    },
    didDrawCell: (data) => {
      // Color code status cells
      if (data.column.index === 5 && data.section === "body") {
        const status = data.cell.raw.toLowerCase();
        let color;

        switch (status) {
          case "present":
            color = [39, 174, 96]; // Green
            break;
          case "absent":
            color = [231, 76, 60]; // Red
            break;
          case "late":
            color = [243, 156, 18]; // Orange
            break;
          default:
            color = [149, 165, 166]; // Gray
        }

        doc.setTextColor(color[0], color[1], color[2]);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text(
          data.cell.raw,
          data.cell.x + data.cell.width / 2,
          data.cell.y + data.cell.height / 2,
          { align: "center", baseline: "middle" }
        );
      }
    },
    margin: { top: 10, left: 14, right: 14 },
    didDrawPage: (data) => {
      // Add footer with page number
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Page ${data.pageNumber} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );

      // Add footer line
      doc.setDrawColor(200, 200, 200);
      doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);
    },
  });

  // Add summary at the end if there are multiple pages
  const finalY = doc.lastAutoTable.finalY || yPosition;
  if (statistics && finalY < pageHeight - 50) {
    addFooterSummary(doc, statistics, finalY + 10);
  }

  // Save the PDF
  doc.save(fileName);
};

/**
 * Add statistics summary box
 */
const addStatisticsSummary = (doc, statistics, yPosition) => {
  const boxHeight = 20;
  const boxWidth = 180;
  const boxX = (doc.internal.pageSize.getWidth() - boxWidth) / 2;

  // Draw box
  doc.setFillColor(236, 240, 241); // Light gray background
  doc.roundedRect(boxX, yPosition, boxWidth, boxHeight, 3, 3, "F");

  // Add border
  doc.setDrawColor(52, 152, 219); // Blue border
  doc.setLineWidth(0.5);
  doc.roundedRect(boxX, yPosition, boxWidth, boxHeight, 3, 3, "S");

  // Add statistics text
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(52, 73, 94);

  const startX = boxX + 10;
  const textY = yPosition + 7;

  doc.text(`Total Records: ${statistics.total || 0}`, startX, textY);
  doc.setTextColor(39, 174, 96); // Green
  doc.text(
    `Present: ${statistics.present || 0}`,
    startX + 45,
    textY
  );
  doc.setTextColor(231, 76, 60); // Red
  doc.text(`Absent: ${statistics.absent || 0}`, startX + 90, textY);
  doc.setTextColor(243, 156, 18); // Orange
  doc.text(`Late: ${statistics.late || 0}`, startX + 130, textY);

  doc.setTextColor(52, 73, 94);
  doc.text(
    `Attendance Rate: ${statistics.percentage || 0}%`,
    startX + 45,
    textY + 7
  );
};

/**
 * Add footer summary
 */
const addFooterSummary = (doc, statistics, yPosition) => {
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(52, 73, 94);

  doc.text("Summary:", 14, yPosition);
  yPosition += 7;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  doc.setTextColor(52, 73, 94);
  doc.text(`Total Records: ${statistics.total || 0}`, 20, yPosition);
  yPosition += 5;

  doc.setTextColor(39, 174, 96);
  doc.text(
    `Present: ${statistics.present || 0} (${
      Math.round(
        (statistics.present / (statistics.total || 1)) * 100
      ) || 0
    }%)`,
    20,
    yPosition
  );
  yPosition += 5;

  doc.setTextColor(231, 76, 60);
  doc.text(
    `Absent: ${statistics.absent || 0} (${
      Math.round(
        (statistics.absent / (statistics.total || 1)) * 100
      ) || 0
    }%)`,
    20,
    yPosition
  );
  yPosition += 5;

  doc.setTextColor(243, 156, 18);
  doc.text(
    `Late: ${statistics.late || 0} (${
      Math.round((statistics.late / (statistics.total || 1)) * 100) ||
      0
    }%)`,
    20,
    yPosition
  );
};

/**
 * Format date to readable string
 */
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Format time to readable string
 */
const formatTime = (timestamp) => {
  if (!timestamp) return "N/A";
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

/**
 * Generate attendance report for a specific date
 */
export const generateDateReport = async (
  attendanceData,
  filters,
  selectedStudent = null
) => {
  const statistics = calculateStatistics(attendanceData);

  const title = selectedStudent
    ? `Attendance Report - ${selectedStudent.name}`
    : "Daily Attendance Report";

  const fileName = selectedStudent
    ? `attendance_${selectedStudent.name
        .replace(/\s+/g, "_")
        .toLowerCase()}_${filters.date}.pdf`
    : `attendance_${filters.date}.pdf`;

  generateAttendanceReport({
    title,
    attendanceData,
    filters,
    statistics,
    fileName,
  });
};

/**
 * Generate attendance report for a specific class on a date
 */
export const generateClassDateReport = async (
  attendanceData,
  filters,
  className
) => {
  const statistics = calculateStatistics(attendanceData);

  const title = `Class Attendance Report - ${className}`;
  const fileName = `attendance_${className
    .replace(/\s+/g, "_")
    .toLowerCase()}_${filters.date}.pdf`;

  generateAttendanceReport({
    title,
    attendanceData,
    filters: {
      ...filters,
      className,
    },
    statistics,
    fileName,
  });
};

/**
 * Generate attendance report for a date range
 */
export const generateDateRangeReport = async (
  attendanceData,
  filters,
  className
) => {
  const statistics = calculateStatistics(attendanceData);

  const title = className
    ? `Attendance Report - ${className} (Date Range)`
    : "Attendance Report (Date Range)";

  const fileName = className
    ? `attendance_${className
        .replace(/\s+/g, "_")
        .toLowerCase()}_${filters.dateFrom}_to_${filters.dateTo}.pdf`
    : `attendance_${filters.dateFrom}_to_${filters.dateTo}.pdf`;

  generateAttendanceReport({
    title,
    attendanceData,
    filters: {
      ...filters,
      className,
    },
    statistics,
    fileName,
  });
};

/**
 * Calculate attendance statistics
 */
const calculateStatistics = (attendanceData) => {
  const total = attendanceData.length;
  const present = attendanceData.filter(
    (r) => r.status === "present"
  ).length;
  const absent = attendanceData.filter((r) => r.status === "absent").length;
  const late = attendanceData.filter((r) => r.status === "late").length;
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

  return {
    total,
    present,
    absent,
    late,
    percentage,
  };
};

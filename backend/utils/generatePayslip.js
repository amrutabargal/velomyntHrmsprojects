const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const COMPANY_CONFIG = require('../config/company');

const generatePayslipPDF = async (salary, employee) => {
  return new Promise((resolve, reject) => {
    try {
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(__dirname, '../uploads/payslips');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filename = `payslip_${employee.emp_id}_${salary.month}_${salary.year}.pdf`;
      const filepath = path.join(uploadsDir, filename);

      const doc = new PDFDocument({ margin: 50 });

      // Create write stream
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // Header
      doc.fontSize(20)
         .fillColor('#2c3e50')
         .text('PAYSLIP', { align: 'center' });

      doc.moveDown();

      // Company Info - Velomynt
      doc.fontSize(12)
         .fillColor('#34495e')
         .text(`Company Name: ${COMPANY_CONFIG.name}`, { align: 'center' })
         .text(`Address: ${COMPANY_CONFIG.address}`, { align: 'center' })
         .text(`Phone: ${COMPANY_CONFIG.phone}`, { align: 'center' })
         .text(`Email: ${COMPANY_CONFIG.email}`, { align: 'center' });

      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();

      doc.moveDown();

      // Employee Information
      doc.fontSize(14)
         .fillColor('#2c3e50')
         .text('Employee Information', { underline: true });

      doc.moveDown(0.5);

      doc.fontSize(11)
         .fillColor('#34495e')
         .text(`Employee ID: ${employee.emp_id}`, 50, doc.y)
         .text(`Name: ${employee.name}`, 50, doc.y + 20)
         .text(`Email: ${employee.email}`, 50, doc.y + 20)
         .text(`Department: ${employee.department || 'N/A'}`, 50, doc.y + 20)
         .text(`Designation: ${employee.designation || 'N/A'}`, 50, doc.y + 20);

      doc.moveDown();

      // Salary Period
      doc.fontSize(11)
         .text(`Salary Period: ${salary.month} ${salary.year}`, { align: 'right' });

      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // Earnings
      doc.fontSize(14)
         .fillColor('#2c3e50')
         .text('Earnings', { underline: true });

      doc.moveDown(0.5);

      doc.fontSize(11)
         .fillColor('#34495e')
         .text(`Basic Salary: ₹${salary.basic.toFixed(2)}`, 50, doc.y)
         .text(`HRA: ₹${salary.hra.toFixed(2)}`, 300, doc.y)
         .text(`DA: ₹${salary.da.toFixed(2)}`, 50, doc.y + 20)
         .text(`Allowances: ₹${salary.allowances.toFixed(2)}`, 300, doc.y + 20);

      doc.moveDown();

      doc.fontSize(12)
         .fillColor('#27ae60')
         .text(`Gross Salary: ₹${salary.gross_salary.toFixed(2)}`, { align: 'right' });

      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // Deductions
      doc.fontSize(14)
         .fillColor('#2c3e50')
         .text('Deductions', { underline: true });

      doc.moveDown(0.5);

      let yPos = doc.y;
      doc.fontSize(11)
         .fillColor('#34495e')
         .text(`PF: ₹${salary.pf.toFixed(2)}`, 50, yPos)
         .text(`Tax: ₹${salary.tax.toFixed(2)}`, 300, yPos)
         .text(`Other Deductions: ₹${salary.deductions.toFixed(2)}`, 50, yPos + 20);
      
      if (salary.leave_deduction && salary.leave_deduction > 0) {
        doc.text(`Leave Deduction: ₹${salary.leave_deduction.toFixed(2)}`, 300, yPos + 20);
      }

      const totalDeductions = salary.pf + salary.tax + salary.deductions + (salary.leave_deduction || 0);

      doc.moveDown();

      doc.fontSize(12)
         .fillColor('#e74c3c')
         .text(`Total Deductions: ₹${totalDeductions.toFixed(2)}`, { align: 'right' });

      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // Net Salary
      doc.fontSize(16)
         .fillColor('#2c3e50')
         .text(`Net Salary: ₹${salary.net_salary.toFixed(2)}`, { align: 'center' });

      doc.moveDown(2);

      // Footer
      doc.fontSize(10)
         .fillColor('#7f8c8d')
         .text('This is a system generated payslip.', { align: 'center' })
         .text('Generated on: ' + new Date().toLocaleDateString(), { align: 'center' });

      doc.end();

      stream.on('finish', () => {
        resolve(`/uploads/payslips/${filename}`);
      });

      stream.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = generatePayslipPDF;


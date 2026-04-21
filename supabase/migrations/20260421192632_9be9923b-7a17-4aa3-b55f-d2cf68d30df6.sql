-- VPI: full access in Academics
CREATE POLICY "VPI manage classes" ON public.classes FOR ALL TO authenticated USING (has_role(auth.uid(), 'vpi'::app_role)) WITH CHECK (has_role(auth.uid(), 'vpi'::app_role));
CREATE POLICY "VPI manage class_subjects" ON public.class_subjects FOR ALL TO authenticated USING (has_role(auth.uid(), 'vpi'::app_role)) WITH CHECK (has_role(auth.uid(), 'vpi'::app_role));
CREATE POLICY "VPI manage class_schedules" ON public.class_schedules FOR ALL TO authenticated USING (has_role(auth.uid(), 'vpi'::app_role)) WITH CHECK (has_role(auth.uid(), 'vpi'::app_role));
CREATE POLICY "VPI manage departments" ON public.departments FOR ALL TO authenticated USING (has_role(auth.uid(), 'vpi'::app_role)) WITH CHECK (has_role(auth.uid(), 'vpi'::app_role));
CREATE POLICY "VPI manage academic_years" ON public.academic_years FOR ALL TO authenticated USING (has_role(auth.uid(), 'vpi'::app_role)) WITH CHECK (has_role(auth.uid(), 'vpi'::app_role));
CREATE POLICY "VPI manage academic_periods" ON public.academic_periods FOR ALL TO authenticated USING (has_role(auth.uid(), 'vpi'::app_role)) WITH CHECK (has_role(auth.uid(), 'vpi'::app_role));
CREATE POLICY "VPI manage academic_events" ON public.academic_events FOR ALL TO authenticated USING (has_role(auth.uid(), 'vpi'::app_role)) WITH CHECK (has_role(auth.uid(), 'vpi'::app_role));
CREATE POLICY "VPI manage assessment_types" ON public.assessment_types FOR ALL TO authenticated USING (has_role(auth.uid(), 'vpi'::app_role)) WITH CHECK (has_role(auth.uid(), 'vpi'::app_role));
CREATE POLICY "VPI manage student_grades" ON public.student_grades FOR ALL TO authenticated USING (has_role(auth.uid(), 'vpi'::app_role)) WITH CHECK (has_role(auth.uid(), 'vpi'::app_role));
CREATE POLICY "VPI manage grade_locks" ON public.grade_locks FOR ALL TO authenticated USING (has_role(auth.uid(), 'vpi'::app_role)) WITH CHECK (has_role(auth.uid(), 'vpi'::app_role));
CREATE POLICY "VPI manage attendance_sessions" ON public.attendance_sessions FOR ALL TO authenticated USING (has_role(auth.uid(), 'vpi'::app_role)) WITH CHECK (has_role(auth.uid(), 'vpi'::app_role));
CREATE POLICY "VPI manage attendance_records" ON public.attendance_records FOR ALL TO authenticated USING (has_role(auth.uid(), 'vpi'::app_role)) WITH CHECK (has_role(auth.uid(), 'vpi'::app_role));
CREATE POLICY "VPI manage report_card_settings" ON public.report_card_settings FOR ALL TO authenticated USING (has_role(auth.uid(), 'vpi'::app_role)) WITH CHECK (has_role(auth.uid(), 'vpi'::app_role));
CREATE POLICY "VPI manage department_report_colors" ON public.department_report_colors FOR ALL TO authenticated USING (has_role(auth.uid(), 'vpi'::app_role)) WITH CHECK (has_role(auth.uid(), 'vpi'::app_role));
CREATE POLICY "VPI view students" ON public.students FOR SELECT TO authenticated USING (has_role(auth.uid(), 'vpi'::app_role));
CREATE POLICY "VPI view profiles" ON public.profiles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'vpi'::app_role));

-- Registrar: full access in Finance
CREATE POLICY "Registrar manage fee_categories" ON public.fee_categories FOR ALL TO authenticated USING (has_role(auth.uid(), 'registrar'::app_role)) WITH CHECK (has_role(auth.uid(), 'registrar'::app_role));
CREATE POLICY "Registrar manage fee_structures" ON public.fee_structures FOR ALL TO authenticated USING (has_role(auth.uid(), 'registrar'::app_role)) WITH CHECK (has_role(auth.uid(), 'registrar'::app_role));
CREATE POLICY "Registrar manage division_fee_rates" ON public.division_fee_rates FOR ALL TO authenticated USING (has_role(auth.uid(), 'registrar'::app_role)) WITH CHECK (has_role(auth.uid(), 'registrar'::app_role));
CREATE POLICY "Registrar manage installment_plans" ON public.installment_plans FOR ALL TO authenticated USING (has_role(auth.uid(), 'registrar'::app_role)) WITH CHECK (has_role(auth.uid(), 'registrar'::app_role));
CREATE POLICY "Registrar manage fee_assignments" ON public.fee_assignments FOR ALL TO authenticated USING (has_role(auth.uid(), 'registrar'::app_role)) WITH CHECK (has_role(auth.uid(), 'registrar'::app_role));
CREATE POLICY "Registrar manage payments" ON public.payments FOR ALL TO authenticated USING (has_role(auth.uid(), 'registrar'::app_role)) WITH CHECK (has_role(auth.uid(), 'registrar'::app_role));
CREATE POLICY "Registrar manage expenses" ON public.expenses FOR ALL TO authenticated USING (has_role(auth.uid(), 'registrar'::app_role)) WITH CHECK (has_role(auth.uid(), 'registrar'::app_role));
CREATE POLICY "Registrar manage student_bills" ON public.student_bills FOR ALL TO authenticated USING (has_role(auth.uid(), 'registrar'::app_role)) WITH CHECK (has_role(auth.uid(), 'registrar'::app_role));
CREATE POLICY "Registrar manage student_bill_items" ON public.student_bill_items FOR ALL TO authenticated USING (has_role(auth.uid(), 'registrar'::app_role)) WITH CHECK (has_role(auth.uid(), 'registrar'::app_role));
CREATE POLICY "Registrar manage student_payments" ON public.student_payments FOR ALL TO authenticated USING (has_role(auth.uid(), 'registrar'::app_role)) WITH CHECK (has_role(auth.uid(), 'registrar'::app_role));
CREATE POLICY "Registrar view students" ON public.students FOR SELECT TO authenticated USING (has_role(auth.uid(), 'registrar'::app_role));
CREATE POLICY "Registrar view profiles" ON public.profiles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'registrar'::app_role));
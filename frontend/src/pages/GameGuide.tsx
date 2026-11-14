/** Advice for the teacher: how to choose a difficulty for each question, the time per question and the boss health. */
export function GameGuide() {
  return (
    <details className="panel gg">
      <summary>
        <h2>คำแนะนำการตั้งค่าเกม</h2>
        <span className="hint">เลือดบอส ระดับความยาก และเวลาต่อข้อ ควรตั้งอย่างไร</span>
      </summary>

      <h3>เลือกระดับความยากของแต่ละข้ออย่างไร</h3>
      <div className="tr-scroll">
        <table className="tr-table gg-table">
          <thead>
            <tr>
              <th>ระดับ</th>
              <th>ดาเมจพื้นฐาน</th>
              <th>เหมาะกับโจทย์แบบไหน</th>
              <th>เวลาที่ควรให้</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>ง่าย</td>
              <td>20</td>
              <td className="tr-name">ความจำ นิยาม คำศัพท์ ตอบได้ทันทีถ้าจำได้</td>
              <td>10-15 วิ</td>
            </tr>
            <tr>
              <td>ปานกลาง</td>
              <td>30</td>
              <td className="tr-name">ต้องคิดหรือคำนวณหนึ่งขั้น เปรียบเทียบ ตีความโจทย์</td>
              <td>20-30 วิ</td>
            </tr>
            <tr>
              <td>ยาก</td>
              <td>40</td>
              <td className="tr-name">คิดหลายขั้น วิเคราะห์ โจทย์ยาว หรือมีตัวลวงใกล้เคียง</td>
              <td>30-45 วิ</td>
            </tr>
          </tbody>
        </table>
      </div>
      <ul className="gg-list">
        <li>สัดส่วนที่เล่นสนุก: ง่ายประมาณครึ่งหนึ่ง ปานกลาง 3 ใน 10 ยาก 2 ใน 10 เรียงจากง่ายไปยากเพื่อให้นักเรียนสะสมคอมโบได้ก่อน</li>
        <li>เวลาต่อข้อตั้งได้ค่าเดียวทั้งเกม ให้ตั้งตามข้อที่ใช้เวลามากที่สุดในชุด ตอบเร็วได้ดาเมจมากกว่าอยู่แล้ว</li>
        <li>บอสอาจเร่งเวลาให้เหลือครึ่งหนึ่ง (ไม่ต่ำกว่า 7 วิ) ถ้าโจทย์ยาวควรตั้งเวลาเผื่อไว้</li>
      </ul>

      <h3>เลือดบอสควรเท่าไร</h3>
      <p className="hint">
        ในส่วน "เปิดห้องเล่นเกม" ใส่จำนวนนักเรียนโดยประมาณ ระบบจะคำนวณเลือดบอสที่แนะนำจากชุดคำถามที่เลือกให้ 3 ระดับ ตารางนี้เป็นค่าประมาณสำหรับชุด 10 ข้อ
        ที่มีง่าย 5 ปานกลาง 3 ยาก 2
      </p>
      <div className="tr-scroll">
        <table className="tr-table gg-table">
          <thead>
            <tr>
              <th>นักเรียน</th>
              <th>ชนะง่าย</th>
              <th>พอดี</th>
              <th>ท้าทาย</th>
            </tr>
          </thead>
          <tbody>
            {[5, 10, 20, 30, 40].map((n) => {
              const total = n * 0.66 * 270;
              const tidy = (v: number) => Math.round(v / 50) * 50;
              return (
                <tr key={n}>
                  <td>{n} คน</td>
                  <td>{tidy(total * 0.6).toLocaleString('th-TH')}</td>
                  <td>{tidy(total * 0.8).toLocaleString('th-TH')}</td>
                  <td>{tidy(total).toLocaleString('th-TH')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ul className="gg-list">
        <li>คิดจากนักเรียนทั่วไปที่ตอบถูกราว 6 ใน 10 ข้อ ถ้าห้องเก่งให้เลือก "ท้าทาย" ถ้าเป็นบทใหม่ให้เลือก "ชนะง่าย"</li>
        <li>ถ้าเลือดบอสหมดก่อนคำถามหมด เกมจะจบทันที ข้อที่เหลือจะไม่ได้ถาม ถ้าอยากให้ถามครบทุกข้อให้ตั้งเลือดสูงไว้</li>
        <li>จำนวนข้อเพิ่มเป็นสองเท่า เลือดบอสก็ควรเพิ่มเป็นสองเท่า</li>
      </ul>
    </details>
  );
}

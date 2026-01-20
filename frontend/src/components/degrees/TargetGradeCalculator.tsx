/**
 * Target Grade Calculator Widget
 * Interactive calculator showing required average on remaining work
 */
import { useState, useEffect, useCallback } from 'react';
import { degreesAPI } from '../../api/degrees';
import type { TargetGradeCalculation } from '../../types/degrees';

interface TargetGradeCalculatorProps {
  programId: string;
  currentAverage?: number;
}

export default function TargetGradeCalculator({ programId, currentAverage }: TargetGradeCalculatorProps) {
  const [targetGrade, setTargetGrade] = useState(70);
  const [calculation, setCalculation] = useState<TargetGradeCalculation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Debounced API call
  useEffect(() => {
    const timer = setTimeout(() => {
      if (programId && targetGrade >= 0 && targetGrade <= 100) {
        fetchCalculation(targetGrade);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [targetGrade, programId]);

  const fetchCalculation = async (target: number) => {
    setLoading(true);
    setError('');

    try {
      const response = await degreesAPI.calculateTargetGrade(programId, target);
      setCalculation(response.data);
    } catch (err: any) {
      console.error('Failed to calculate target grade:', err);
      setError('Failed to calculate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const setPresetGrade = (grade: number) => {
    setTargetGrade(grade);
  };

  const getGaugeColor = (required: number): string => {
    if (required > 100) return 'bg-gray-400'; // Impossible
    if (required > 90) return 'bg-red-500'; // Very difficult
    if (required > 75) return 'bg-yellow-500'; // Challenging
    return 'bg-green-500'; // Achievable
  };

  const getGaugeTextColor = (required: number): string => {
    if (required > 100) return 'text-gray-600';
    if (required > 90) return 'text-red-600';
    if (required > 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getAchievabilityLabel = (achievable: boolean, required: number): JSX.Element => {
    if (required > 100) {
      return (
        <span className="flex items-center text-gray-600 font-semibold">
          <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          Not Achievable (Impossible)
        </span>
      );
    }

    if (!achievable) {
      return (
        <span className="flex items-center text-red-600 font-semibold">
          <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          Not Achievable
        </span>
      );
    }

    return (
      <span className="flex items-center text-green-600 font-semibold">
        <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        Achievable
      </span>
    );
  };

  const getGradeLabel = (grade: number): string => {
    if (grade >= 70) return 'First Class';
    if (grade >= 60) return '2:1 (Upper Second)';
    if (grade >= 50) return '2:2 (Lower Second)';
    if (grade >= 40) return 'Third Class';
    return 'Fail';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Target Grade Calculator</h3>

      {/* Preset Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setPresetGrade(70)}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            targetGrade === 70
              ? 'bg-green-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          First (70%)
        </button>
        <button
          onClick={() => setPresetGrade(60)}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            targetGrade === 60
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          2:1 (60%)
        </button>
        <button
          onClick={() => setPresetGrade(50)}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            targetGrade === 50
              ? 'bg-yellow-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          2:2 (50%)
        </button>
      </div>

      {/* Target Grade Slider */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-semibold text-gray-700">Target Grade</label>
          <span className="text-2xl font-bold text-blue-600">{targetGrade}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={targetGrade}
          onChange={(e) => setTargetGrade(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Results */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-sm text-gray-600 mt-2">Calculating...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {!loading && !error && calculation && (
        <div className="space-y-4">
          {/* Current vs Target */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Current Average</div>
              <div className="text-2xl font-bold text-blue-600">
                {calculation.current_average ? calculation.current_average.toFixed(1) : 'N/A'}%
              </div>
              {calculation.current_average && (
                <div className="text-xs text-gray-500 mt-1">
                  {getGradeLabel(calculation.current_average)}
                </div>
              )}
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Target Grade</div>
              <div className="text-2xl font-bold text-purple-600">
                {calculation.target_grade.toFixed(0)}%
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {getGradeLabel(calculation.target_grade)}
              </div>
            </div>
          </div>

          {/* Required Average Gauge */}
          <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg">
            <div className="text-sm font-semibold text-gray-700 mb-2">
              Required Average on Remaining Work
            </div>

            {/* Gauge Bar */}
            <div className="mb-3">
              <div className="h-8 bg-gray-200 rounded-full overflow-hidden relative">
                <div
                  className={`h-full ${getGaugeColor(calculation.required_average_on_remaining)} transition-all duration-300`}
                  style={{
                    width: `${Math.min(calculation.required_average_on_remaining, 100)}%`
                  }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-lg font-bold ${getGaugeTextColor(calculation.required_average_on_remaining)}`}>
                    {calculation.required_average_on_remaining.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Achievability */}
            <div className="flex items-center justify-between">
              {getAchievabilityLabel(calculation.achievable, calculation.required_average_on_remaining)}
              {calculation.achievable && calculation.margin >= 0 && (
                <span className="text-sm text-gray-600">
                  Margin: <span className="font-semibold text-green-600">{calculation.margin.toFixed(1)}%</span>
                </span>
              )}
            </div>
          </div>

          {/* Additional Info */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">
              {calculation.required_average_on_remaining > 100 ? (
                <>The target grade is mathematically impossible to achieve with the remaining work.</>
              ) : calculation.required_average_on_remaining > 90 ? (
                <>You need to score very high ({calculation.required_average_on_remaining.toFixed(1)}%) on all remaining work. This is extremely challenging.</>
              ) : calculation.required_average_on_remaining > 75 ? (
                <>You need to score {calculation.required_average_on_remaining.toFixed(1)}% on remaining work. This is challenging but achievable with strong effort.</>
              ) : (
                <>You need to score {calculation.required_average_on_remaining.toFixed(1)}% on remaining work. This is achievable with consistent effort.</>
              )}
            </p>
          </div>
        </div>
      )}

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
}
